import './globals.css';

export const metadata = {
  title: 'Movister - Ваш личный каталог фильмов',
  description: 'Удобный каталог фильмов и сериалов с возможностью онлайн-просмотра',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Rubik:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* FontAwesome for Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
