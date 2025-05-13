# Veltro - Controle Inteligente para seus Investimentos

<div align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-orange" alt="Status: Em Desenvolvimento">
  <img src="https://img.shields.io/badge/licença-MIT-blue" alt="Licença: MIT">
  <img src="https://img.shields.io/badge/versão-1.0.0-green" alt="Versão: 1.0.0">
</div>

<p align="center">
  <img src="public/veltro-logo.png" alt="Veltro Logo" width="200">
</p>

## 📊 Visão Geral

Veltro é uma plataforma moderna para controle de investimentos, desenvolvida independentemente com foco na experiência do usuário e simplicidade. Acompanhe seus ativos de renda variável e fixa com uma interface intuitiva e visualizações detalhadas sobre seu portfólio.

## ✨ Características

### Disponíveis Agora

- **🔄 Renda Variável**: Acompanhamento de ações, ETFs e FIIs com atualização automática de cotações em tempo real da B3
- **💸 Controle de Dividendos**: Registro e visualização de todos os proventos recebidos
- **📈 Análise de Desempenho**: Visualize o rendimento e evolução do seu patrimônio
- **👥 Multiusuários**: Perfis separados para cada membro da família
- **🔍 Consolidação Inteligente**: Consolidação automática de ativos para melhor visualização da composição da carteira
- **🔐 Segurança**: Autenticação segura e proteção de dados

### Em Desenvolvimento

- **💰 Renda Fixa**: Controle de investimentos em renda fixa (CDBs, LCIs, LCAs, Tesouro Direto)
- **₿ Criptomoedas**: Integração com principais exchanges de criptomoedas
- **💼 Gestão Financeira**: Controle de gastos pessoais e orçamento familiar

## 🚀 Tecnologias

- **Frontend**: Next.js, React, TypeScript, Framer Motion
- **UI/UX**: TailwindCSS, Radix UI, Shadcn UI
- **Backend**: Next.js API Routes, PostgreSQL, Prisma ORM
- **Autenticação**: JWT, Cookies
- **Integrações**: API B3 (cotações em tempo real)

## 💻 Requisitos

- Node.js 18+ 
- PostgreSQL
- NPM ou Yarn

## 🛠️ Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/coder-muller/veltro.git
   cd veltro
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
   
   Edite o arquivo `.env.local` com suas configurações:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/veltro
   JWT_SECRET=seu_jwt_secret
   NEXT_PUBLIC_BRAPI_API_KEY: seu_token_brapi
   ```

4. Execute as migrações do banco de dados:
   ```bash
   npx prisma migrate dev
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

6. Acesse a aplicação em `http://localhost:3000`

## 📝 Como Usar

1. **Crie uma conta**: Registre-se na plataforma para começar a usar
2. **Crie carteiras**: Organize seus investimentos em diferentes carteiras
3. **Adicione ativos**: Cadastre seus investimentos com detalhes de compra
4. **Registre dividendos**: Mantenha o histórico de proventos recebidos
5. **Visualize desempenho**: Acompanhe a evolução do seu patrimônio

## ✅ Roadmap

- [x] Sistema de autenticação
- [x] Gerenciamento de carteiras
- [x] Controle de ativos variáveis
- [x] Sistema de dividendos
- [ ] Controle de renda fixa
- [ ] Dashboard com indicadores gerais
- [ ] Sistema de metas financeiras
- [ ] Integração com criptomoedas
- [ ] Controle de gastos pessoais
- [ ] Relatórios detalhados por período

## 🤝 Contribua

Este projeto é desenvolvido independentemente, mas contribuições são bem-vindas! Se você é um desenvolvedor e gostaria de contribuir para este projeto ou tem sugestões para melhorias, entre em contato:

- **Email**: guilhermemullerxx@gmail.com
- **GitHub**: [Abra uma issue](https://github.com/coder-muller/veltro/issues/new)

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE). Sinta-se livre para usar, modificar e distribuir conforme necessário.

---

<div align="center">
  Desenvolvido com 💙 por Guilherme Muller
</div>