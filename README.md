# ☕ MeetingManager

A modern web app to manage coffee and lunch meetings. Plan and track your personal meetups with friends, colleagues, and contacts.

## 🎯 Features

- **Calendar view**: Modern monthly calendar similar to Outlook
- **People management**: Manage contacts with name, email, and notes
- **Meeting planning**: Track coffee and lunch meetings
- **Reminders**: Highlight when the next meeting is due
- **List view**: Clean list of all meetings with filters
- **Per-person stats**: See when you last met someone, with color coding
- **Local database**: All data stays on your machine (IndexedDB)
- **Export/Import**: Backup and restore your data via JSON

## 🚀 Installation & Start

### Requirements
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional installations required

### Quick Start

1. Download all files into a folder:
   - index.html
   - styles.css
   - app.js
   - database.js

2. Open index.html in your browser:
   - Double-click the file, or
   - Right-click → "Open with" → choose your browser

3. Done! The app runs locally in your browser.

### Alternative: Local server (recommended for development)

With Python:

```bash
python3 -m http.server 8000
```

Then open: http://localhost:8000

With Node.js:

```bash
npm install -g http-server
http-server
```

## 📖 Usage

### Add a person

1. Click "+ Person" in the sidebar
2. Enter name, email (optional), and notes
3. Click "Save"

### Create a meeting

**Method 1 – via the calendar:**
1. Click a day in the calendar
2. Select the person and type (☕ Coffee or 🍽️ Lunch)
3. Optionally enter time, notes, and reminder interval
4. Save

**Method 2 – via the people list:**
1. Click "+ Meeting" next to a person
2. Fill out the form
3. Save

### View meetings

- **Calendar view**: Meetings appear as icons (☕/🍽️)
- **List view**: Switch to list view for detailed overview
- Click a meeting to view details

### Reminders

Set a reminder interval (in days) per meeting:
- e.g., "30" for monthly meetups
- e.g., "90" for quarterly meetups

Overdue meetings are highlighted in the people list and list view.

### Search & Filter

- **People search**: Use the search box in the sidebar
- **Meeting filters**: In list view you can filter by type and status:
  - All / Coffee / Lunch
  - All / Past / Upcoming / Overdue

## 💾 Data Storage

All data is stored locally in your browser (IndexedDB):
- ✅ No cloud, no server
- ✅ Your data stays private
- ✅ Works offline
- ⚠️ Data is browser-specific (not synchronized across browsers)
- ⚠️ Clearing cache may delete data

### Backup data

Use the built-in Export/Import buttons in the header to save and restore your data as JSON.

## 🎨 Customization

### Change colors

Edit CSS variables in styles.css:

```css
:root {
    --primary-color: #2563eb;
    --danger-color: #dc2626;
    --success-color: #16a34a;
}
```

### Add more meeting types

In index.html, add more options under the meeting type select:

```html
<select id="meetingType" required>
    <option value="coffee">☕ Coffee</option>
    <option value="lunch">🍽️ Lunch</option>
    <option value="dinner">🍷 Dinner</option>
</select>
```

## 🔧 Technical Details

### Tech Stack

- **HTML5**
- **CSS3** (Grid, Flexbox)
- **Vanilla JavaScript**
- **IndexedDB** (local browser database)

### Project Structure

```
MeetingManager/
├── index.html
├── styles.css
├── app.js
├── database.js
└── README.md
```

### Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## 🐛 Troubleshooting

### App doesn’t load
- Ensure all files are in the same folder
- Open browser console (F12) and check for errors
- Try another browser

### Data not saved
- Ensure IndexedDB is supported
- Private/Incognito mode may prevent saving
- Ensure cookies/storage are not blocked

### Design looks wrong
- Check if styles.css is loaded
- Clear browser cache (Cmd+Shift+R)

## 📝 License

This project is free to use for private and commercial purposes.

## 🤝 Contributing

Suggestions and improvements are welcome!

### Possible enhancements
- [ ] Browser notifications for reminders
- [ ] Week view in calendar
- [ ] Categories/tags for people
- [ ] Per-meeting notes and attachments
- [ ] Statistics and reports
- [ ] Dark mode
- [ ] Mobile-optimized version (PWA)

## 📞 Support

If you have questions or issues:
1. Check the troubleshooting section above
2. Open the browser console (F12) for detailed errors
3. Create an issue in the repository

---

**Enjoy managing your meetups! ☕🍽️**
