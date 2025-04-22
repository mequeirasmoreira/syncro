# Página de Agendamentos

## 1. Visão Geral

Este módulo implementa a página de **Agendamentos**, permitindo visualizar, filtrar e gerenciar registros de agendamentos de forma integrada.

- Localização no projeto: `front/app/(pages)/usual/scheduling`

## 2. Dependências e Bibliotecas

- **Next.js** + **TypeScript**
- **Supabase**: cliente para operações CRUD e autenticação
- **React Query**: gerenciamento de estado assíncrono e cache de dados
- **ThemeContext**: suporte a tema claro/escuro
- **logger**: padrão de logs (usa `logger.debug` em pontos críticos)

## 3. Estrutura de Pastas e Componentes

```text
scheduling/
├── components/
│   ├── AppointmentList.tsx      # Lista de agendamentos
│   ├── AppointmentFilter.tsx    # Componentes de filtro e pesquisa
│   └── AppointmentSidebar.tsx   # Painel lateral com detalhes do agendamento selecionado
├── new/
│   └── page.tsx                 # Página para criar novo agendamento
└── page.tsx                     # Componente de página principal
```

## 4. Serviços e Métodos Principais

- **AppointmentService** (`front/services/AppointmentService.ts`)
  - `getAppointments(params?)`: busca lista de agendamentos com filtros e paginação
  - `getAppointmentById(id)`: obtém detalhes de um agendamento específico
  - `createAppointment(data)`, `updateAppointment(id, data)`, `deleteAppointment(id)`

- **Hooks personalizados**
  - `useAppointments(params)`: hook do React Query para lista de agendamentos
  - `useAppointment(id)`: hook do React Query para dados de um único agendamento

## 5. Fluxo Lógico da Página

1. **Montagem inicial**: `useAppointments` executa query para carregar lista de agendamentos.
2. **Filtros e Pesquisa**: `AppointmentFilter` atualiza parâmetros e dispara re-fetch.
3. **Exibição**: `AppointmentList` renderiza resultados em forma de lista ou tabela.
4. **Detalhamento e Ações**: ao selecionar um agendamento, `AppointmentSidebar` exibe informações e ações (editar, excluir).
5. **Criação de novos agendamentos**: navega para `new/page.tsx` para formulário de criação.

## 6. Detalhamento de Componentes

### AppointmentFilter
- **Props**  
  - `dateRange: { from: Date; to: Date }`  
  - `onChange(filters)`: callback quando usuário ajusta data/cliente/status  
- **Lógica**  
  - Mantém estado local de cada campo de filtro  
  - Ao submeter, chama `onChange` com objeto `{ dateRange, clientId, status }`  
- **Exemplo de uso**  
```tsx
<AppointmentFilter
  dateRange={filters.dateRange}
  onChange={newFilters => setFilters(newFilters)}
/>
```
```ts
logger.debug(
  "[AppointmentFilter] - onChange - filtros:",
  newFilters
);
```

### AppointmentList
- **Props**  
  - `appointments: Appointment[]`  
  - `onSelect(id: string)`: ao clicar em um item  
- **Lógica**  
  - Renderiza lista/tabela com data formatada (`date-fns`)  
  - Paginação simples  
- **Exemplo de uso**  
```tsx
<AppointmentList
  appointments={data}
  onSelect={setSelectedId}
/>
```
```ts
logger.debug(
  "[AppointmentList] - render - total:",
  appointments.length
);
```

### AppointmentSidebar
- **Props**  
  - `appointment: Appointment`  
  - `onEdit()`, `onDelete()`  
- **Lógica**  
  - Exibe campos detalhados  
  - Botões acionam rotas ou service  
- **Exemplo de uso**  
```tsx
<AppointmentSidebar
  appointment={selected}
  onEdit={() => router.push(`/scheduling/${id}/edit`)}
  onDelete={() => deleteAppointment(id)}
/>
```
```ts
logger.debug(
  "[AppointmentSidebar] - onDelete - id:",
  id
);
```

## 7. Exemplos de Hooks e Service

```ts
// useAppointments (React Query)
export function useAppointments(params) {
  return useQuery(
    ["appointments", params],
    () => AppointmentService.getAppointments(params),
    { staleTime: 1000 * 60 }
  );
}
```

```ts
// AppointmentService.getAppointments
export async function getAppointments(params) {
  logger.debug("[AppointmentService] - getAppointments - params:", params);
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .match(params);
  if (error) throw error;
  return data;
}
```

---

*Documentação gerada em 2025-04-21.*
