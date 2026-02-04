# referNconnect | Employee Directory

A premium, local-first internal employee directory with a focusing on **Ethereal Design** and **Ease of Use**.

## 🚀 Features

- **Local CSV Import**: Import your company directory instantly without any cloud dependencies.
- **Ethereal Interface**: Modern glassmorphism UI with smooth transitions and persistent dark mode.
- **Full Detail View**: Display and manage all company and employee metadata.
- **Integrated Editing**: Pencil icon (✏️) on cards allows you to correct or update details instantly.
- **Zero Dependencies**: Pure vanilla JavaScript with no external libraries or cloud APIs.
- **Fast Search**: Real-time filtering by name, role, or company.

## 📁 Clean Architecture

The project follows a streamlined, modular structure for maximum performance:

```
referNconnect/
├── index.html        # Entry point
├── src/
│   ├── app.js        # Main application orchestrator
│   ├── services.js   # Unified Storage & CSV logic
│   └── config.js     # Centralized configuration
├── styles/
│   └── main.css      # Consolidated Ethereal design tokens
└── email_lists/      # Sample data for testing
```

## 🎯 Getting Started

1. Clone the repository.
2. Start a local server:
   ```bash
   python3 -m http.server 8080
   ```
3. Open [http://localhost:8080](http://localhost:8080) and upload your CSV.

## 📊 CSV Format Supported

The application maps standard LinkedIn/Export headers automatically:
- Company Name, Domain, Industry, Size
- First Name, Last Name, Email, Job Title, LinkedIn, Location

## 📝 License

MIT
