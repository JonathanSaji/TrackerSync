# SubSync

> A subscription tracking app that helps you manage recurring payments and get AI-powered financial advice.

---

## Prerequisites

Make sure you have the following installed before running the app:

- **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
  - Verify with: `node --version`
- **[Git](https://git-scm.com/)** (to clone the repo)
  - Verify with: `git --version`
- A code editor like **[VS Code](https://code.visualstudio.com/)** (recommended)
  - Install the **Live Server** extension by Ritwick Dey for frontend development

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ProjectBeta-ICS4U.git
cd ProjectBeta-ICS4U
```

### 2. Install node.js

**https://nodejs.org/en**
>Use to download node.js
>After that check node.js version (to make sure you have it)
```bash
node -v
```

### 3. Install dependencies

```bash
npm install
```

> If you get a PowerShell execution policy error on Windows, run this first:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

### 4. Set up your environment variables

Create or dropin in `.env` file in the root of the project:

```
OPENAI_API_KEY=sk-your-openai-key-here
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### 5. Start the server

```bash
node server.js
```

The app will be running at **http://localhost:5001**

---

## Test Accounts

The app uses simple local authentication. Use one of the test accounts to log in:

| Username | Password |
|----------|----------|
| user1    | pass1    |
| user2    | pass2    |

---

## Testing the AI

To test the OpenAI integration directly without starting the full server:

```bash
node openai-test.js
```

Make sure your `.env` file is set up with a valid `OPENAI_API_KEY` first.

---

## Branch Workflow

> **Never commit directly to `main`.** Always use a feature branch.

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make changes, then commit
git add .
git commit -m "feat: describe what you did"

# Push and open a Pull Request on GitHub
git push origin feature/your-feature-name
```

See the full Git workflow guide in the project wiki or ask a team member.

---

## Dependencies

| Package  | Purpose                        |
|----------|-------------------------------|
| express  | Backend web server             |
| cors     | Cross-origin request handling  |
| dotenv   | Load environment variables     |
| openai   | OpenAI API client              |
