import { db, TABELAS } from './db';
import { hojeISO } from './calculos';
import { lerBackup, type Backup } from './validacao';

export async function exportarBackup(): Promise<void> {
  const perfil = await db.perfil.get(1);
  if (!perfil) return;
  const backup: Backup = {
    app: 'monju-pessoal',
    versao: 2,
    exportadoEm: new Date().toISOString(),
    perfil,
    aplicacoes: await db.aplicacoes.toArray(),
    pesos: await db.pesos.toArray(),
    preferencias: (await db.preferencias.get(1)) ?? null,
    planos: await db.planos.toArray(),
    diario: await db.diario.toArray(),
    agua: await db.agua.toArray(),
  };
  const nome = `monju-backup-${hojeISO()}.json`;
  const arquivo = new File([JSON.stringify(backup, null, 2)], nome, { type: 'application/json' });

  // No iPhone o compartilhamento permite salvar em Arquivos/iCloud.
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: nome });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Substitui todos os dados pelo conteúdo do backup. Lança Error se o arquivo for inválido. */
export async function importarBackup(texto: string): Promise<void> {
  const b = lerBackup(texto);
  await db.transaction('rw', TABELAS(), async () => {
    await Promise.all(TABELAS().map((t) => t.clear()));
    await db.perfil.put(b.perfil);
    await db.aplicacoes.bulkAdd(b.aplicacoes);
    await db.pesos.bulkAdd(b.pesos);
    if (b.preferencias) await db.preferencias.put(b.preferencias);
    await db.planos.bulkAdd(b.planos);
    await db.diario.bulkAdd(b.diario);
    await db.agua.bulkAdd(b.agua);
  });
}

export async function apagarTudo(): Promise<void> {
  await db.transaction('rw', TABELAS(), async () => {
    await Promise.all(TABELAS().map((t) => t.clear()));
  });
}
