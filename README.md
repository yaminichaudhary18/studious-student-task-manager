# 🎓 Studious - Responsive Student Task & Study Manager

Studious is a responsive, client-side web application designed for students to organize coursework, manage assignment deadlines, track study progress, and prioritize daily tasks efficiently.

---

## ✨ Features

- **Task Management**: Create, edit, delete, and mark tasks as completed.
- **Priority Levels**: Categorize tasks into 🔴 Urgent, 🟠 High, 🟡 Medium, and 🟢 Low urgency tiers.
- **Subtask Checklists**: Break assignments into actionable steps with interactive checklist progress tracking.
- **Search & Filtering**: Real-time keyword search across task titles, subjects, descriptions, and subtasks. Multi-filter dropdowns for priority and subject, plus quick view tabs (*All Tasks, Due Today, Upcoming, Overdue, Completed*).
- **Sorting Options**: Sort tasks by Due Date (Earliest/Latest), Urgency Level, Title (A-Z), or Recently Added.
- **Dashboard Analytics**: Visual completion progress ring and counters for Total, Pending, Completed, and Overdue tasks.
- **Data Persistence**: Offline state management using browser `localStorage`. Includes sample student tasks for immediate initial exploration.
- **Theme Switching**: Dark and Light theme toggle with saved user preference.
- **Mobile Responsive**: Adaptive drawer navigation and floating action button for mobile and tablet viewports.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic layout and form components.
- **CSS3**: CSS Custom Properties (Design tokens), Flexbox, CSS Grid, and responsive media queries.
- **JavaScript (ES6+)**: Vanilla JS module with state management and DOM event handling.
- **Icons & Fonts**: Google Fonts (*Inter*, *Plus Jakarta Sans*) & FontAwesome icons.

---

## 🚀 How to Run Locally

### Option 1: Local HTTP Server (Recommended)

Run a local HTTP server using Python:

```bash
python -m http.server 8080
```

Open your browser and navigate to:
```
http://localhost:8080
```

### Option 2: Direct Browser Launch

Open `index.html` directly in any standard modern web browser.

---

## 📁 Project Structure

```
student-task-manager/
├── index.html   # Main HTML structure and modal templates
├── style.css    # Design tokens, themes, layouts, and responsive styling
├── app.js       # Core application logic, storage, and event handlers
├── .gitignore   # Git repository ignore rules
└── README.md    # Project documentation
```

---

## 🔮 Future Improvements

- 📅 **Calendar Grid View**: Monthly calendar view for exam schedules.
- 🔔 **Browser Notifications**: Native browser alerts for imminent deadlines.
- 📤 **Data Backup**: Export and import task data via JSON or CSV files.
- ☁️ **Cloud Sync**: Optional cloud database integration for multi-device sync.
