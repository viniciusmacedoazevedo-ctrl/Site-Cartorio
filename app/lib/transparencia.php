<?php
declare(strict_types=1);

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function rubricas(): array
{
    static $r = null;
    return $r ??= require APP_DIR . '/content/transparencia.php';
}

function moeda(?float $v): string
{
    return $v === null ? '–' : 'R$ ' . number_format($v, 2, ',', '.');
}

/** Converte "1.234,56", "1234,56" ou "1234.56" em float; vazio vira null. */
function ler_moeda(string $s): ?float
{
    $s = trim(str_replace(['R$', ' '], '', $s));
    if ($s === '') {
        return null;
    }
    if (str_contains($s, ',')) {
        $s = str_replace('.', '', $s);
        $s = str_replace(',', '.', $s);
    }
    return is_numeric($s) ? round((float) $s, 2) : NAN;
}

function mes_nome(int $m): string
{
    return MESES[$m - 1] ?? '';
}
