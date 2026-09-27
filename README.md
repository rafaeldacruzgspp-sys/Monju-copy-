# Monju Pessoal

App pessoal (PWA) para acompanhar o tratamento com GLP-1 (Mounjaro, Ozempic etc.):
entrevista inicial, registro de aplicações, peso com IMC e meta, próxima dose e backup.
Os dados ficam só no aparelho.

Especificação: [`docs/superpowers/specs/2026-09-27-monju-pessoal-fase1-design.md`](docs/superpowers/specs/2026-09-27-monju-pessoal-fase1-design.md)

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173/Monju-copy-/
npm test         # testes dos cálculos e do backup
npm run build    # gera dist/
```

## Publicação (GitHub Pages)

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Cada push na `main` testa, gera e publica o app em
   `https://<usuario>.github.io/Monju-copy-/`.

## Instalar no iPhone

Abra o link no **Safari** → botão **Compartilhar** → **Adicionar à Tela de Início**.
