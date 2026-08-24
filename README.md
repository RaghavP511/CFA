# 📈 CFA® Level I Study Tracker & 24-Day Sprint Dashboard

A high-performance, responsive web application designed for CFA® candidates to systematically track learning modules, manage the 24-day sprint schedule, practice EOCQ/Q-Bank questions, and review core exam formulas and traps.

---

## 🌟 Key Features

1. **Live Exam Countdown & Core Metrics**:
   - Real-time countdown clock to CFA exam day.
   - Comprehensive progress metrics (Overall % Completion, Modules Done, Sprint Tasks Completed, Hours Logged).
   - Topic completion vs. Official CFA Topic Weightings chart (Ethics 15-20%, FSA 13-17%, Fixed Income 12-14%, Equity 10-12%, Quant 8-12%, etc.).

2. **Master Curriculum Tracker (103 Learning Modules)**:
   - Complete database of all 10 Level I topic areas and 103 modules.
   - Instant filtering by Topic, Status (`Not Started`, `In Progress`, `Complete`), and keyword search.
   - 1-click status cycling (`Not Started` &rarr; `In Progress` &rarr; `Complete`).
   - Personal notes per module.

3. **24-Day EOCQ-First Sprint Schedule**:
   - Interactive daily checklists for all 4 phases (Heavyweights, The Push, The Sprint, Final Triage).
   - Commitments and schedule reminders (pickleball, religious classes, weekend chore blocks).
   - The **5 Golden Sprint Rules** built-in.

4. **Deep Mastery Review & Formula Traps**:
   - Comprehensive revision notes for all 10 CFA topic areas.
   - Edge case warnings, decision frameworks (Ethics duty hierarchy, Central Limit Theorem, LIFO/FIFO conversions, Modigliani-Miller, Option Greeks).
   - Live concept search.

5. **Study Log & Pomodoro Timer**:
   - Built-in customizable timer (Pomodoro 25m, Short Break 5m, Sprint 50m).
   - Session logger with duration, questions attempted, questions correct, and automatic accuracy % tracking.

6. **Offline-First & Local Storage**:
   - Automatically saves all your progress to your browser.
   - 1-click JSON backup export and CSV progress export.
   - 1-click backup restore.

---

## 🚀 How to Put This Code on GitHub & Publish Your Live Website

### Step 1: Create a New Repository on GitHub
1. Go to [GitHub](https://github.com/new) and log in.
2. Enter repository name: `cfa-study-tracker` (or any name you prefer).
3. Set visibility to **Public** (or **Private**).
4. **Do not** check "Add a README file" (as we already have one).
5. Click **Create repository**.

### Step 2: Push Your Local Code to GitHub
Open your terminal (PowerShell or Command Prompt) in this directory:

```bash
cd "c:\Users\ragha\OneDrive\cfa-study-tracker"
git init
git add .
git commit -m "Initial commit: CFA Study Tracker & 24-Day Sprint Web App"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/cfa-study-tracker.git
git push -u origin main
```
*(Replace `<YOUR_GITHUB_USERNAME>` with your actual GitHub username).*

---

### Step 3: Enable Free GitHub Pages Website (Instant Live URL!)
Once your code is pushed to GitHub:

1. Open your repository page on GitHub.
2. Click **Settings** (top tab with gear icon).
3. In the left sidebar, click **Pages** (under *Code and automation*).
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch` (or GitHub Actions).
   - **Branch**: Select `main` and folder `/ (root)`.
   - Click **Save**.
5. In 1–2 minutes, GitHub will generate your live public URL:
   `https://<YOUR_GITHUB_USERNAME>.github.io/cfa-study-tracker/`

---

## 💻 Running Locally on Your Computer

You can run this instantly without installing any dependencies!

Simply double-click `index.html` in your file explorer, or launch a quick local server using Python:

```bash
cd "c:\Users\ragha\OneDrive\cfa-study-tracker"
python -m http.server 8000
```
Then open your browser to `http://localhost:8000`.

---

## 🛠️ Tech Stack
- **HTML5 & Vanilla JavaScript**: Zero runtime dependencies, offline-first.
- **Tailwind CSS CDN**: Modern responsive UI with dark/light mode.
- **Lucide Icons**: Crisp vector iconography.
- **Chart.js**: Interactive progress visualization.
- **Canvas Confetti**: Visual celebration for completed milestones.
- **GitHub Actions & GitHub Pages**: Free zero-maintenance static web hosting.
