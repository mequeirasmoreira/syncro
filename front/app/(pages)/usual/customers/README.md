# Página de Clientes

## 1. Visão Geral

Este módulo implementa a página de **Clientes**, permitindo visualizar, filtrar e gerenciar registros de clientes de forma integrada.

- Localização no projeto: `front/app/(pages)/usual/customers`

## 2. Dependências e Bibliotecas

- **Next.js** + **TypeScript**
- **Supabase**: cliente para operações CRUD e autenticação
- **React Query**: gerenciamento de estado assíncrono e cache de dados
- **ThemeContext**: suporte a tema claro/escuro
- **logger**: padrão de logs (usa `logger.debug` em pontos críticos)

## 3. Estrutura de Pastas e Componentes

```text
customers/
├── filter/
│   └── CustomerFilter.tsx       # Componentes de filtro e pesquisa
├── grid/
│   └── CustomerGrid.tsx         # Tabela/grade de exibição de clientes
├── sidebar/
│   └── CustomerSidebar.tsx      # Painel lateral com detalhes do cliente selecionado
└── index.tsx                    # Componente de página principal
```

## 4. Serviços e Métodos Principais

- **CustomerService** (`front/services/CustomerService.ts`)
  - `getCustomers(params?)`: busca lista de clientes com suporte a filtros e paginação
  - `getCustomerById(id)`: obtém detalhes de um cliente específico
  - `createCustomer(data)`, `updateCustomer(id, data)`, `deleteCustomer(id)`

- **Hooks personalizados**
  - `useCustomers(params)`: hook do React Query para lista de clientes
  - `useCustomer(id)`: hook do React Query para dados de um único cliente

## 5. Fluxo Lógico da Página

1. **Montagem inicial**: `useCustomers` executa query para carregar lista de clientes.
2. **Filtros e Pesquisa**: `CustomerFilter` atualiza parâmetros e reaciona na listagem.
3. **Exibição**: `CustomerGrid` renderiza resultados em forma de tabela.
4. **Detalhamento**: ao selecionar um cliente, `CustomerSidebar` exibe informações e ações disponíveis.

---

*Documentação gerada em 2025-04-21.*
