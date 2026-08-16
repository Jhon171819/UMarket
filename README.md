# UMarket

Aplicativo mobile de gestão para pequenos negócios que trabalham com produtos, serviços ou os dois.

## O que já funciona

- Dashboard com faturamento, alertas de estoque, ações rápidas e produtos mais vendidos.
- Estoque com busca, filtros, cadastro/edição de produtos e ajustes rápidos de quantidade.
- PDV mobile com produtos e serviços no mesmo carrinho.
- Leitura de código de barras pela câmera ou busca manual.
- Cliente opcional e formas de pagamento no fechamento da venda.
- Histórico de vendas com faturamento, ticket médio e filtros por período.
- Resumo financeiro e informações do negócio.
- Persistência local com SQLite: os dados continuam disponíveis depois de fechar e abrir o app.

## Stack

- Expo SDK 54 + React Native + TypeScript
- Expo Router
- Expo Camera
- Expo SQLite para o banco local-first
- React Native SVG / Chart Kit disponíveis para evoluções visuais

## Executar

```bash
npm install
npm start
```

Depois, abra com Expo Go no celular ou use `a` / `i` no terminal para Android/iOS.

O modo padrão usa `--offline` porque este é um app local-first: ele evita a validação online do Expo, que pode atrasar ou esconder o menu do terminal. O Metro e o QR continuam disponíveis na rede local.

Na primeira execução, o Metro pode levar alguns segundos para reconstruir o cache. O comando `start:clear` sempre apaga o cache e deve ser usado somente para recuperação; no uso normal, prefira `npm start`.

Se ele ficar parado em `Starting Metro Bundler`, encerre a instância com `Ctrl+C` e execute:

```bash
npm run start:clear
```

Para emulador ou navegador local, use `npm run start:localhost`. O servidor permanece aberto no terminal enquanto o app está rodando; isso é esperado.

Para validar o bundle nativo Android:

```bash
npx expo export --platform android
```

## Modelo de dados

Os valores monetários são armazenados em centavos (`priceCents`, `costCents`, `totalCents`) e formatados somente na interface. O estoque é alterado por ações explícitas de entrada, saída ou venda. O banco local é o arquivo SQLite `umarket.db`, gerenciado pelo Expo SQLite.

O acesso ao banco passa por `StoreRepository`, com `SQLiteStoreRepository` ativo hoje e `ApiStoreRepository` preparado para a evolução futura. Assim, a API poderá substituir o adaptador local sem acoplar a UX mobile ao banco. A tabela `migrations` já registra a versão do schema.

## Estrutura

```text
app/
  (tabs)/
    index.tsx       # dashboard
    stock.tsx       # estoque
    scanner.tsx     # PDV e scanner
    sales.tsx       # histórico de vendas
    settings.tsx    # empresa e financeiro
data/
  StoreContext.tsx  # estado local e persistência
  localDatabase.ts  # schema SQLite e adaptadores local/API
components/
  theme.ts          # tokens visuais e formatação monetária
```

## Dados locais

O app inicia sem registros fictícios. Produtos, serviços, clientes e vendas são criados pelo usuário e persistidos no SQLite local. Dados de demonstração, quando necessários para desenvolvimento, devem ser inseridos por um seed explícito e nunca usados como estado inicial do app.
