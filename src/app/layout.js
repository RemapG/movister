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
        
        {/* Smart TV Remote Debugging Script */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.onerror = function(message, source, lineno, colno, error) {
            var div = document.getElementById('tv-debug-error') || document.createElement('div');
            div.id = 'tv-debug-error';
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.width = '100%';
            div.style.background = '#e74c3c';
            div.style.color = '#ffffff';
            div.style.zIndex = '999999';
            div.style.padding = '15px';
            div.style.fontSize = '16px';
            div.style.fontWeight = 'bold';
            div.style.fontFamily = 'monospace';
            div.style.whiteSpace = 'pre-wrap';
            div.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
            div.innerHTML = '🔴 JS RUNTIME ERROR:\\n' + message + '\\n\\nFile: ' + source + ' (line ' + lineno + ', col ' + colno + ')' + '\\nStack: ' + (error ? error.stack : 'N/A');
            document.body.appendChild(div);
          };
          window.onunhandledrejection = function(event) {
            var div = document.getElementById('tv-debug-rejection') || document.createElement('div');
            div.id = 'tv-debug-rejection';
            div.style.position = 'fixed';
            div.style.bottom = '0';
            div.style.left = '0';
            div.style.width = '100%';
            div.style.background = '#f39c12';
            div.style.color = '#000000';
            div.style.zIndex = '999999';
            div.style.padding = '15px';
            div.style.fontSize = '16px';
            div.style.fontWeight = 'bold';
            div.style.fontFamily = 'monospace';
            div.style.whiteSpace = 'pre-wrap';
            div.innerHTML = '⚠️ UNHANDLED REJECTION:\\n' + (event.reason ? (event.reason.stack || event.reason.message || event.reason) : event);
            document.body.appendChild(div);
          };
        ` }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
