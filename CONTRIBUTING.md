# Contributing to Trackerr

Thank you for your interest in contributing to **Trackerr**! We welcome contributions of all sizes—whether it's fixing bugs, writing tests, refining UI styles, or suggesting features.

To maintain a clean and reliable codebase, please follow the guidelines below.

---

## 🛠 Getting Started

1. **Fork the Repository**: Create a personal copy of the repository on GitHub.
2. **Clone the Fork**: Clone the personal fork locally.
   ```bash
   git clone https://github.com/YOUR_USERNAME/Trackerr.git
   cd Trackerr
   ```
3. **Set Up Environments**:
   - Copy `.env.example` to `.env` and fill out your local environment credentials.
   - Run `npm install` to install dependencies.
4. **Create a Topic Branch**:
   - Create a feature or bugfix branch off `main`. Use a descriptive name:
     - `git checkout -b feature/your-awesome-feature`
     - `git checkout -b bugfix/fix-some-bug`

---

## 🎨 Code Style & Standards

- **TypeScript**: We enforce strict types. Ensure everything is typed properly and compiles successfully (`npm run build`).
- **CSS Styles**: Use Vanilla CSS variables declared in `app/globals.css` to align with the premium styling tokens (colors, animations, border-radius, shadows).
- **React Standards**: Avoid state updates during initial SSR render cycles. Use the `isMounted` state guards to avoid hydration errors.

---

## 🧪 Testing Guidelines

We use property-based testing and unit testing via **Vitest** and **fast-check**. All contributions must pass all automated test suites.

Before submitting a pull request, run:
```bash
# Run the entire test suite
npm run test

# Check test coverage
npm run test:coverage
```

If you are adding new features, please write corresponding unit or property tests inside the `*.test.ts` or `*.test.tsx` file alongside your changes.

---

## 📝 Commit Messages

We follow clean and descriptive commit guidelines to keep git logs clear and readable:
- Use semantic prefixes:
  - `feat(...)`: for new features or UI components
  - `fix(...)`: for bug fixes
  - `docs(...)`: for documentation changes
  - `test(...)`: for adding or correcting tests
  - `refactor(...)`: for code restructuring
- Example: `feat(ui): add confirmation dialogs for application deletion`

---

## 🚀 Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feature/your-awesome-feature
   ```
2. Open a Pull Request (PR) from your branch to Trackerr's `main` branch.
3. Describe your changes clearly in the PR description, including references to any related GitHub issues.
4. Verify that all automated CI checks and builds pass.

Once submitted, maintaining developers will review your code as soon as possible. Thank you for making Trackerr better!
