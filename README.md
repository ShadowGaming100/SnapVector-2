# SnapVector

## Overview
SnapVector is a professional media hosting web application that enables users to upload, view, and share images and videos. It provides a clean UI, theme toggling, user authentication, and account management. This repository contains only the front‑end implementation.

*Note: This project is not open for self-hosting.*

## Features
- **User authentication** – Sign in, register, or continue as a guest.  
- **Theme toggle** – Light/Dark mode with automatic system preference detection.  
- **Media upload** – Drag‑and‑drop or file selector, supporting images (≤10 MB) and videos (≤50 MB), up to 10 files per upload.  
- **Upload queue** – Preview, progress tracking, and cancelation.  
- **Automatic expiration** – Files are purged on the 1st of the next month with warning banners.  
- **Media gallery** – Responsive grid of uploaded files with preview.  
- **File details view** – Shareable link, social sharing buttons, and delete option.  
- **Account settings** – Theme selection, username/password changes, session history.  
- **Responsive design** – Works on desktop and mobile browsers.


## Usage
1. **Sign in** or **register** a new account, or click **Continue as Guest**.  
2. Use the **Upload Media** section to drag files onto the drop zone or click to select them.  
3. Monitor upload progress; cancel any pending uploads with the **Cancel All** button.  
4. View uploaded files in the **Your Files** gallery.  
5. Click a file to open the **File Details** view, copy the shareable link, or share on social media.  
6. Manage your account via the **Account Settings** panel, including theme preference and password changes.

## Project Structure
```
├─ index.html        # Main HTML entry point
├─ style.css         # Global styles and theme definitions
├─ script.js         # Front‑end logic (auth, upload, UI)
├─ manifest.json     # PWA manifest
├─ README.md         # This documentation
├─ LICENSE           # MIT License
├─ admin.html
├─ faq.html
├─ privacy.html
├─ terms.html
└─ icon.png          # Favicon / app icon
```

## Contributing
Contributions focusing on UI/UX improvements, accessibility, or integration with backend services are welcome. Fork the repository, create a feature branch, and submit a pull request.

## License
This project is licensed under the MIT License – see the `LICENSE` file for details.

## Acknowledgements
- Icons from **Font Awesome**.  
- Fonts from **Google Fonts** (Inter).  
- UI inspiration from various media‑hosting platforms.

## Contact
For questions, feature requests, or support, open an issue on the GitHub repository, or can email snapvector@outlook.de.