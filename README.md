# PDF Downloader Pro

![PDF Downloader Pro](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black)

A modern, sleek web application that allows users to download protected PDFs from Google Drive and other sources. Built with Next.js and featuring a minimalist black and white design.

## 🚀 Features

- **Universal PDF Support**: Download PDFs from various sources including Google Drive
- **Two Download Modes**:
  - Normal Download: For standard, directly accessible PDFs
  - Protected Download: For Google Drive and other protected PDFs
- **Real-time Progress Tracking**: View detailed progress information during downloads
- **Modern UI/UX**:
  - Clean black and white theme
  - Responsive design
  - Animated background
  - Progress indicators
- **Error Handling**: Comprehensive error messages and recovery options

## 🛠️ Technologies Used

- **Frontend**:
  - Next.js 14
  - React
  - TypeScript
  - Chakra UI
  - Framer Motion
- **PDF Processing**:
  - jsPDF
  - html2canvas
- **Development**:
  - ESLint
  - Prettier
  - TypeScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- npm or yarn
- Git

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rajisnotop/pdf-downloader.git
   ```

2. Navigate to the project directory:
   ```bash
   cd pdf-downloader
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🚀 Deployment

The application is configured for easy deployment to GitHub Pages:

1. Update `next.config.js` with your repository name
2. Push your changes to the main branch
3. GitHub Actions will automatically build and deploy

## 📖 Usage

1. **Normal PDF Download**:
   - Paste the PDF URL
   - Click "Download PDF"
   - Select "Normal Download"
   - Wait for the download to complete

2. **Protected PDF Download**:
   - Paste the protected PDF URL
   - Click "Download PDF"
   - Select "Protected Download"
   - Scroll through all pages in the viewer
   - Click download when ready

## ⚙️ Configuration

The application can be configured through environment variables:

```env
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Chakra UI for the component library
- All contributors who have helped this project grow

## 📧 Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter)

Project Link: [https://github.com/rajisnotop/pdf-downloader](https://github.com/rajisnotop/pdf-downloader)

## ⚠️ Disclaimer

This tool is for educational purposes only. Please respect copyright and terms of service when downloading PDFs. Always ensure you have the right to download and use the PDFs you access through this tool.

---
Made with ❤️ by PDF Downloader Team
