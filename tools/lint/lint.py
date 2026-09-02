#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Линтер контрактов дизайн-системы. Одно правило: action-menu/no-trigger-variant.

Источник правил — rules/*.json. Каждое правило несёт якорь в контракт:
путь, раздел и дословную цитату. Перед проверкой цитата ищется в контракте;
если её нет, линтер останавливается и сообщает о расхождении, а не молчит.
"""
import argparse, hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FREEZE_DATE = '2026-09-01'
BASELINE_NOTE = ('существующие нарушения, зафиксированные как долг: '
                 'линтер их показывает, но ошибкой не считает')
IDENTITY_NOTE = {
    'ключ': ['rule', 'file', 'fingerprint'],
    'fingerprint': 'sha256 от имени тега и его атрибутов со схлопнутыми пробелами, первые 16 hex',
    'кратность': 'count — сколько одинаковых вызовов заморожено в этом файле; сверх count считается новым',
    'не_используется': ['line_hint'],
    'line_hint': 'номер строки на момент заморозки; справочный, при сверке не читается',
}
DS_OPS = os.path.abspath(os.path.join(HERE, '..', '..'))


def skip_string(s, i):
    q = s[i]; i += 1
    while i < len(s) and s[i] != q:
        if s[i] == '\\': i += 1
        i += 1
    return i + 1


def match_bracket(s, i):
    """i — индекс открывающей скобки; вернуть индекс парной закрывающей."""
    depth = 0
    while i < len(s):
        c = s[i]
        if c in '{([':
            depth += 1
        elif c in '})]':
            depth -= 1
            if depth == 0:
                return i
        elif c in '"\'`':
            i = skip_string(s, i) - 1
        i += 1
    return -1


def split_top(s):
    """Элементы верхнего уровня списка, по запятым вне скобок и строк."""
    parts, depth, buf, i = [], 0, [], 0
    while i < len(s):
        c = s[i]
        if c in '{([':
            depth += 1
        elif c in '})]':
            depth -= 1
        elif c in '"\'`':
            j = skip_string(s, i); buf.append(s[i:j]); i = j; continue
        if c == ',' and depth == 0:
            parts.append(''.join(buf)); buf = []; i += 1; continue
        buf.append(c); i += 1
    if ''.join(buf).strip():
        parts.append(''.join(buf))
    return [x.strip() for x in parts if x.strip()]


def count_list(text):
    """Число элементов литерального списка. (n, разобрано)."""
    t = text.strip()
    if not t.startswith('['):
        return 0, False
    j = match_bracket(t, 0)
    if j == -1:
        return 0, False
    n, ok = 0, True
    for it in split_top(t[1:j]):
        if it.startswith('...'):
            inner_ok = False
            for m in re.finditer(r'\[', it):
                k = match_bracket(it, m.start())
                if k != -1:
                    c, o = count_list(it[m.start():k + 1])
                    n += c; inner_ok = o; break
            ok = ok and inner_ok
        else:
            n += 1
    return n, ok


def count_actions(props):
    """Сколько действий в вызове. (n, разобрано).

    Понимает и будущий плоский список actions, и нынешние groups.
    """
    if 'actions' in props:
        return count_list(props['actions'][0])
    if 'groups' not in props:
        return 0, False
    t = props['groups'][0].strip()
    if not t.startswith('['):
        return 0, False
    j = match_bracket(t, 0)
    if j == -1:
        return 0, False
    total, ok = 0, True
    for g in split_top(t[1:j]):
        if g.startswith('...'):
            got = False
            for m in re.finditer(r'\[', g):
                k = match_bracket(g, m.start())
                if k != -1:
                    for gg in split_top(g[m.start() + 1:k]):
                        c, o = _group_actions(gg)
                        total += c; ok = ok and o
                    got = True
                    break
            ok = ok and got
        else:
            c, o = _group_actions(g)
            total += c; ok = ok and o
    return total, ok


def _group_actions(group_text):
    m = re.search(r'\bactions\s*:', group_text)
    if not m:
        return 0, False
    rest = group_text[m.end():].strip()
    if not rest.startswith('['):
        return 0, False
    return count_list(rest)


def _is_destructive(obj_text):
    """Стоит ли destructive: true среди полей верхнего уровня объекта.

    Вложенные объекты не смотрим: признак — поле самого действия.
    Возвращает True, False или None, если это не объектный литерал.
    """
    t = obj_text.strip()
    if not t.startswith('{'):
        return None
    j = match_bracket(t, 0)
    if j == -1:
        return None
    for field in split_top(t[1:j]):
        m = re.match(r'destructive\s*:\s*(\w+)', field)
        if m:
            return m.group(1) == 'true'
    return False


def _flags_of_list(text):
    """Признаки destructive по элементам литерального списка.

    (список из True/False/None, разобрано целиком). None — элемент,
    про который сказать нечего: тернарник, переменная, вызов.
    """
    t = text.strip()
    if not t.startswith('['):
        return [], False
    j = match_bracket(t, 0)
    if j == -1:
        return [], False
    flags, ok = [], True
    for it in split_top(t[1:j]):
        if it.startswith('...'):
            # условный спред: спускаемся в первый массив внутри.
            # Действия из него считаем присутствующими — так же,
            # как их считает правило 4.1.
            inner_ok = False
            for m in re.finditer(r'\[', it):
                k = match_bracket(it, m.start())
                if k != -1:
                    f, o = _flags_of_list(it[m.start():k + 1])
                    flags += f; inner_ok = o; break
            ok = ok and inner_ok
        else:
            d = _is_destructive(it)
            if d is None: ok = False
            flags.append(d)
    return flags, ok


def action_flags(props):
    """Признаки destructive по действиям вызова, в порядке следования."""
    if 'actions' in props:
        return _flags_of_list(props['actions'][0])
    if 'groups' not in props:
        return [], False
    t = props['groups'][0].strip()
    if not t.startswith('['):
        return [], False
    j = match_bracket(t, 0)
    if j == -1:
        return [], False
    flags, ok = [], True
    for g in split_top(t[1:j]):
        if g.startswith('...'):
            got = False
            for m in re.finditer(r'\[', g):
                k = match_bracket(g, m.start())
                if k != -1:
                    for gg in split_top(g[m.start() + 1:k]):
                        mm = re.search(r'\bactions\s*:', gg)
                        if not mm: ok = False; continue
                        f, o = _flags_of_list(gg[mm.end():])
                        flags += f; ok = ok and o
                    got = True
                    break
            ok = ok and got
        else:
            mm = re.search(r'\bactions\s*:', g)
            if not mm:
                ok = False; continue
            f, o = _flags_of_list(g[mm.end():])
            flags += f; ok = ok and o
    return flags, ok


def find_tags(src, name):
    """Вхождения <name ...>: (текст атрибутов, номер строки открывающего <)."""
    out = []
    for m in re.finditer(r'<' + re.escape(name) + r'(?=[\s/>])', src):
        i, depth = m.end(), 0
        while i < len(src):
            c = src[i]
            if c in '{([': depth += 1
            elif c in '})]': depth -= 1
            elif c in '"\'`': i = skip_string(src, i); continue
            elif depth == 0 and c == '/' and src[i + 1:i + 2] == '>':
                out.append((src[m.end():i], m.start())); break
            elif depth == 0 and c == '>':
                out.append((src[m.end():i], m.start())); break
            i += 1
    return out


def read_props(tag):
    """Атрибуты верхнего уровня тега: {имя: (значение, смещение)}, и есть ли спред."""
    props, spread, i = {}, False, 0
    while i < len(tag):
        if tag[i] == '{':
            depth, j = 0, i
            while j < len(tag):
                if tag[j] in '{([': depth += 1
                elif tag[j] in '})]':
                    depth -= 1
                    if depth == 0: break
                elif tag[j] in '"\'`': j = skip_string(tag, j) - 1
                j += 1
            if tag[i + 1:j].strip().startswith('...'): spread = True
            i = j + 1; continue
        m = re.compile(r'([A-Za-z_][\w-]*)\s*=').match(tag, i)
        if not m:
            i += 1; continue
        name, j = m.group(1), m.end()
        while j < len(tag) and tag[j].isspace(): j += 1
        if j >= len(tag): break
        if tag[j] in '"\'':
            k = skip_string(tag, j); props[name] = (tag[j + 1:k - 1], m.start()); i = k
        elif tag[j] == '{':
            depth, k = 0, j
            while k < len(tag):
                if tag[k] in '{([': depth += 1
                elif tag[k] in '})]':
                    depth -= 1
                    if depth == 0: break
                elif tag[k] in '"\'`': k = skip_string(tag, k) - 1
                k += 1
            props[name] = (tag[j + 1:k], m.start()); i = k + 1
        else:
            i = j + 1
    return props, spread


def fingerprint(jsx, tag):
    """Отпечаток вызова: имя тега и его атрибуты со схлопнутыми пробелами.

    От номера строки не зависит вовсе. Перенос строк и отступы схлопываются,
    поэтому переформатирование отпечаток не меняет.
    """
    norm = re.sub(r'\s+', ' ', tag).strip()
    h = hashlib.sha256(('<' + jsx + ' ' + norm).encode('utf-8')).hexdigest()[:16]
    return h, ('<' + jsx + ' ' + norm)[:120]


def load_baseline(path):
    if not os.path.exists(path):
        return {'entries': []}
    return json.load(open(path, encoding='utf-8'))


def check_contract(spec, errors):
    path = os.path.join(DS_OPS, spec['contract']['path'])
    if not os.path.exists(path):
        errors.append('контракт не найден: ' + spec['contract']['path']); return None
    text = open(path, encoding='utf-8').read()
    m = re.search(r'^\*\*Статус:\*\*\s*(\w+)', text, re.M)
    status = m.group(1) if m else None
    for r in spec['rules']:
        if r['anchor'] not in text:
            errors.append(
                'правило %s: цитата раздела %s не найдена в %s — правило и контракт разошлись'
                % (r['id'], r['section'], spec['contract']['path']))
    return status


def scan(spec, root_override=None):
    root = os.path.abspath(root_override or os.path.join(DS_OPS, spec['scan']['root']))
    exts = tuple(spec['scan']['extensions'])
    findings, spreads, files, tags = [], [], 0, 0
    for dp, dn, fns in os.walk(root):
        dn[:] = [d for d in dn if d not in spec['scan']['exclude_dirs']]
        for fn in sorted(fns):
            if not fn.endswith(exts): continue
            p = os.path.join(dp, fn)
            rel = os.path.relpath(p, root)
            if any(rel.startswith(x) for x in spec['scan']['exclude_paths']): continue
            src = open(p, encoding='utf-8', errors='replace').read()
            jsx_names = sorted({r['jsx'] for r in spec['rules']})
            seen_file = False
            for jsx in jsx_names:
                if '<' + jsx not in src: continue
                for tag, at in find_tags(src, jsx):
                    tags += 1
                    if not seen_file: files += 1; seen_file = True
                    props, spread = read_props(tag)
                    tag_line = src[:at].count('\n') + 1
                    for rule in spec['rules']:
                        if rule['jsx'] != jsx: continue
                        if rule['check'] == 'prop-forbidden':
                            if rule['prop'] in props:
                                val, off = props[rule['prop']]
                                line = src[:at + len(jsx) + 1 + off].count('\n') + 1
                                fp, excerpt = fingerprint(jsx, tag)
                                findings.append({
                                    'file': rel, 'line': line, 'rule': rule,
                                    'detail': '%s передан со значением "%s"' % (rule['prop'], val),
                                    'fingerprint': fp, 'excerpt': excerpt})
                            elif spread:
                                spreads.append({'file': rel, 'line': tag_line, 'rule': rule,
                                                'why': 'пропсы приходят спредом'})
                        elif rule['check'] == 'destructive-last':
                            flags, ok = action_flags(props)
                            if spread and not ('actions' in props or 'groups' in props):
                                ok = False
                            if not ok:
                                spreads.append({'file': rel, 'line': tag_line, 'rule': rule,
                                                'why': 'список действий собирается в рантайме'})
                            elif True in flags:
                                first = flags.index(True)
                                after = [i for i, f in enumerate(flags)
                                         if i > first and f is False]
                                if after:
                                    fp, excerpt = fingerprint(jsx, tag)
                                    findings.append({
                                        'file': rel, 'line': tag_line, 'rule': rule,
                                        'detail': ('обычное действие на месте %d после '
                                                   'разрушающего на месте %d, всего действий %d'
                                                   % (after[0] + 1, first + 1, len(flags))),
                                        'fingerprint': fp, 'excerpt': excerpt})
                        elif rule['check'] == 'min-actions':
                            n, ok = count_actions(props)
                            if spread and not ('actions' in props or 'groups' in props):
                                ok = False
                            if not ok:
                                spreads.append({'file': rel, 'line': tag_line, 'rule': rule,
                                                'why': 'список действий собирается в рантайме'})
                            elif n < rule['min']:
                                fp, excerpt = fingerprint(jsx, tag)
                                findings.append({
                                    'file': rel, 'line': tag_line, 'rule': rule,
                                    'detail': 'действий %d, требуется не меньше %d' % (n, rule['min']),
                                    'fingerprint': fp, 'excerpt': excerpt})
    return findings, spreads, tags


def key(x):
    return (x['rule']['id'] if isinstance(x.get('rule'), dict) else x['rule'],
            x['file'], x['fingerprint'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', help='переопределить область сканирования')
    ap.add_argument('--baseline', default=os.path.join(HERE, 'baseline.json'))
    ap.add_argument('--freeze', action='store_true',
                    help='переписать baseline текущими нарушениями')
    args = ap.parse_args()

    errors, all_f, all_s, total = [], [], [], 0
    specs = sorted(f for f in os.listdir(os.path.join(HERE, 'rules')) if f.endswith('.json'))
    status = None
    for fn in specs:
        spec = json.load(open(os.path.join(HERE, 'rules', fn), encoding='utf-8'))
        status = check_contract(spec, errors)
        if errors:
            break
        f, sp, t = scan(spec, args.root)
        all_f += f; all_s += sp; total += t
        print('Контракт: %s (статус %s)' % (spec['contract']['path'], status))
        print('Область:  %s' % (args.root or spec['scan']['root']))
        for i, r in enumerate(spec['rules']):
            print('%-9s %s — раздел %s, %s' %
                  ('Правила:' if i == 0 else '', r['id'], r['section'], r['checked_by']))
        print()

    if errors:
        for e in errors:
            print('ОСТАНОВКА: ' + e)
        return 2

    if args.freeze:
        groups = {}
        for x in all_f:
            groups.setdefault(key(x), []).append(x)
        entries = []
        for (rid, file, fp), items in sorted(groups.items()):
            entries.append({'rule': rid, 'file': file, 'section': items[0]['rule']['section'],
                            'detail': items[0]['detail'], 'fingerprint': fp,
                            'count': len(items), 'line_hint': items[0]['line'],
                            'excerpt': items[0]['excerpt'], 'frozen': FREEZE_DATE})
        doc = load_baseline(args.baseline)
        doc.update({'version': 1, 'generated': FREEZE_DATE, 'entries': entries})
        doc.setdefault('что_это', BASELINE_NOTE)
        doc['опознание'] = IDENTITY_NOTE
        json.dump(doc, open(args.baseline, 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=2)
        print('Записано в %s: записей %d, нарушений %d'
              % (os.path.relpath(args.baseline, DS_OPS), len(entries), len(all_f)))
        return 0

    base = load_baseline(args.baseline)
    want = {}
    for e in base['entries']:
        want[(e['rule'], e['file'], e['fingerprint'])] = dict(e)

    got = {}
    for x in all_f:
        got.setdefault(key(x), []).append(x)

    frozen, fresh, stale = [], [], []
    for k, items in sorted(got.items()):
        n = want[k]['count'] if k in want else 0
        frozen += items[:n]
        fresh += items[n:]
    for k, e in sorted(want.items()):
        have = len(got.get(k, []))
        if have < e['count']:
            stale.append((e, e['count'] - have))

    print('Проверено вхождений <ActionMenu: %d' % total)
    print('Нарушений всего: %d — новых %d, замороженных %d'
          % (len(all_f), len(fresh), len(frozen)))
    print()

    if fresh:
        print('НОВЫЕ НАРУШЕНИЯ (%d)' % len(fresh))
        print()
        for x in fresh:
            print('%s:%d' % (x['file'], x['line']))
            print('  нарушено: %s' % x['detail'])
            print('  правило:  %s (раздел %s)' % (x['rule']['id'], x['rule']['section']))
            print('  контракт: %s' % x['rule']['message'])
            print('  отпечаток: %s' % x['fingerprint'])
            print()

    if frozen:
        print('ЗАМОРОЖЕНО В BASELINE (%d) — не ошибка' % len(frozen))
        for x in frozen:
            print('  %s:%d  %s  [%s]'
                  % (x['file'], x['line'], x['detail'], x['fingerprint']))
        print()

    if stale:
        print('BASELINE УСТАРЕЛ (%d) — нарушение исправлено, запись пора вычеркнуть' % len(stale))
        for e, miss in stale:
            print('  %s  %s' % (e['file'], e['rule']))
            print('    отпечаток %s: заморожено %d, в коде %d'
                  % (e['fingerprint'], e['count'], e['count'] - miss))
            print('    строка на момент заморозки — %s, для поиска не использовалась'
                  % e.get('line_hint'))
            print('    вычеркнуть из %s' % os.path.relpath(args.baseline, DS_OPS))
        print()

    if all_s:
        print('НЕ ПРОВЕРЕНО (%d) — это не «чисто», а «неизвестно»' % len(all_s))
        for x in sorted(all_s, key=lambda y: (y['rule']['section'], y['file'], y['line'])):
            print('  %s:%d  раздел %s — %s'
                  % (x['file'], x['line'], x['rule']['section'], x['why']))
        print()

    if status != 'enforced':
        print('Статус контракта — %s, не enforced: CI мержа не блокирует.' % status)
    return 1 if fresh else 0


if __name__ == '__main__':
    sys.exit(main())
