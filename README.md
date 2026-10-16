# ThreeJS — cubo 3D no Power BI

Custom Visual mínimo para validar Three.js e WebGL dentro do Power BI Desktop. Mostra um cubo centralizado, girando nos eixos X e Y, e adapta o canvas ao tamanho do visual.

Não recebe campos ou medidas do modelo. Three.js é importado pelo npm, sem CDN.

## Executar e empacotar

Ambiente usado no projeto: Node.js 22, TypeScript 5.9.3, Power BI Visuals Tools 7.2.1 e API Power BI 5.11.1. O CLI está nas dependências locais; não é necessária instalação global.

No PowerShell, partindo da pasta `BI`:

```powershell
cd ThreeJS
$env:NODE_USE_SYSTEM_CA = "1"
npm.cmd install
npm.cmd run check
npm.cmd test
npm.cmd run package
```

Mantenha `NODE_USE_SYSTEM_CA=1` no terminal usado para npm e PBIVIZ. O sufixo `.cmd` evita o bloqueio de `npm.ps1` pela política de execução deste ambiente. Para reinstalar exatamente as versões do lockfile, use `npm.cmd ci` no lugar de `npm.cmd install`.

O script `package` executa `pbiviz package`. A chamada direta equivalente é:

```powershell
npm.cmd exec -- pbiviz package
```

## Pacote gerado

```text
dist/threeJSTest45CC1E0F2B4D4A8B9C6D7E8F9012A3B4.1.0.0.0.pbiviz
```

O nome usa o GUID e a versão definidos em `pbiviz.json`.

## Importar no Power BI Desktop

1. Abra o relatório e, se solicitado pela sua versão, habilite a opção de desenvolver um visual para a sessão.
2. No painel Visualizações, selecione **… → Importar um visual de um arquivo**.
3. Selecione o arquivo `.pbiviz` da pasta `dist`.
4. Adicione o visual à página. Não é necessário arrastar campos.
5. Confira a rotação do cubo e redimensione o visual para verificar o canvas.

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| [src/visual.ts](src/visual.ts) | Scene, câmera, renderer, cubo, luzes, animação, resize e descarte de recursos. |
| [capabilities.json](capabilities.json) | Permite exibir o visual sem campos. |
| [package.json](package.json) | Dependências e comandos locais. |
| [pbiviz.json](pbiviz.json) | Identidade, metadados e configuração de empacotamento. |
| [test/selfcheck.mjs](test/selfcheck.mjs) | Autoverificação com renderer simulado. |
| [ThreeJSTest.html](ThreeJSTest.html) | Guia técnico com código completo e troubleshooting. |

O `constructor()` cria os objetos Three.js uma vez. O `update()` ajusta o tamanho e a projeção. O loop usa `requestAnimationFrame`; o `destroy()` cancela a animação e libera os recursos.

## Problemas comuns

- **Tela branca ou cubo ausente:** confira os erros do visual e a disponibilidade de WebGL 2 no ambiente. O teste automatizado usa um renderer simulado e não comprova acesso à GPU.
- **Canvas cortado ou deformado:** confirme que o `update()` recebe dimensões válidas e mantém o ajuste do renderer e da câmera.
- **Módulo não encontrado ou erro de tipos:** execute `npm.cmd ci` e `npm.cmd run check` nesta pasta.
- **Erro de certificado npm:** defina `$env:NODE_USE_SYSTEM_CA = "1"` antes dos comandos; não desative a validação TLS.
- **Aviso de `pwsh`/certificado de desenvolvimento:** confira o resultado final do build e a saída em `dist`. Para usar `npm.cmd start`, configure o certificado de desenvolvimento e o PowerShell 7.

Mais detalhes estão no [guia HTML](ThreeJSTest.html).

## Validação e limites

TypeScript, autoverificação e empacotamento foram executados com sucesso. O teste verifica animação, redimensionamento, enquadramento, reutilização de objetos e descarte de recursos.

A renderização real no Power BI Desktop ainda não foi validada. Esta versão do Three.js requer WebGL 2. Os dados de autor e suporte em `pbiviz.json` são placeholders de teste.
