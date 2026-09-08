#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка ссылок корпуса: ведут ли ссылки между записями ds-ops туда,
где что-то есть.

Отдельный инструмент, а не правило линтера. Линтер стережёт контракт:
каждое его правило несёт якорь в контракт и падает с кодом 2, если
цитата разошлась. Здесь стеречь нечего — ссылка не следует ни из какого
контракта, и якоря у неё быть не может. Это проверка целостности
корпуса, а не соответствия правилу, поэтому и кодов у неё два, а не три.

Коды возврата: 0 — все ссылки ведут в существующие файлы;
1 — есть битые.

Запуск из ds-ops/:  python3 tools/links/check.py
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DS_OPS = os.path.abspath(os.path.join(HERE, '..', '..'))
ПРОПУСК = {'node_modules', '.git', 'storybook-static', '.vite'}

# Ссылка markdown на файл. Внешние ссылки и якоря внутри страницы
# не проверяются — за ними нет файла на диске.
ССЫЛКА = re.compile(r'\]\(([^)\s]+)\)')


def погасить_код(текст):
    """Заменить содержимое кода пробелами, сохранив длину и строки.

    Иначе пример ссылки в обратных кавычках или в блоке кода считается
    ссылкой: проверка находит «битую» запись там, где её показывают,
    а не ставят. Найдено на собственном README этого инструмента.
    """
    out = list(текст)

    def гасить(i, j):
        for k in range(i, j):
            if out[k] != '\n':
                out[k] = ' '

    # сначала огороженные блоки ```…```, потом одиночные кавычки
    i = 0
    while True:
        нач = текст.find('```', i)
        if нач == -1:
            break
        кон = текст.find('```', нач + 3)
        кон = len(текст) if кон == -1 else кон + 3
        гасить(нач, кон)
        i = кон
    текст2 = ''.join(out)
    for m in re.finditer(r'`[^`\n]*`', текст2):
        гасить(m.start(), m.end())
    return ''.join(out)


def файлы():
    for dp, dn, fns in os.walk(DS_OPS):
        dn[:] = [d for d in dn if d not in ПРОПУСК]
        for fn in sorted(fns):
            if fn.endswith('.md'):
                yield os.path.join(dp, fn)


def внешняя(путь):
    return путь.startswith(('http://', 'https://', 'mailto:', '#'))


def проверить():
    всего, битые = 0, []
    for p in sorted(файлы()):
        rel_файла = os.path.relpath(p, DS_OPS)
        живой = погасить_код(open(p, encoding='utf-8').read())
        for n, строка in enumerate(живой.split('\n'), 1):
            for m in ССЫЛКА.finditer(строка):
                цель = m.group(1)
                if внешняя(цель):
                    continue
                # якорь после пути отбрасывается: файл тот же
                путь = цель.split('#', 1)[0]
                if not путь:
                    continue
                всего += 1
                абс = os.path.normpath(os.path.join(os.path.dirname(p), путь))
                if not os.path.exists(абс):
                    битые.append((rel_файла, n, цель))
    return всего, битые


def main():
    всего, битые = проверить()
    print('Область:  %s' % os.path.relpath(DS_OPS, os.getcwd()))
    print('Проверено ссылок: %d' % всего)
    print()

    if not битые:
        print('Битых ссылок нет.')
        return 0

    print('БИТЫЕ ССЫЛКИ (%d) — ведут туда, где ничего нет' % len(битые))
    print()
    for файл, строка, цель in битые:
        print('%s:%d' % (файл, строка))
        print('  ссылается на: %s' % цель)
        print()
    print('Чаще всего причина — переезд файла: запись перенесена')
    print('в reshennye/ или в другой каталог, а ссылки остались прежними.')
    print('Проверять надо обе стороны: и ссылки на файл, и ссылки из него.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
