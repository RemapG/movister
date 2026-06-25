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
            div.style.innerHTML = '⚠️ UNHANDLED REJECTION:\\n' + (event.reason ? (event.reason.stack || event.reason.message || event.reason) : event);
            document.body.appendChild(div);
          };
          
          // Hydration warning timeout
          setTimeout(function() {
            if (!window.hydrated) {
              var div = document.createElement('div');
              div.style.position = 'fixed';
              div.style.top = '15%';
              div.style.left = '10%';
              div.style.width = '80%';
              div.style.background = '#d35400';
              div.style.color = '#ffffff';
              div.style.zIndex = '9999999';
              div.style.padding = '25px';
              div.style.fontSize = '18px';
              div.style.fontWeight = 'bold';
              div.style.fontFamily = 'sans-serif';
              div.style.borderRadius = '12px';
              div.style.boxShadow = '0 15px 30px rgba(0,0,0,0.8)';
              div.style.textAlign = 'center';
              div.style.lineHeight = '1.6';
              div.innerHTML = '⚠️ JavaScript не смог запуститься на вашем ТВ.<br/><br/>' +
                'Браузер вашего телевизора не смог загрузить или выполнить JS-скрипты Next.js.<br/>' +
                'Возможная причина: ТВ блокирует сетевые файлы скриптов (например, из-за доверия SSL-сертификату Let\\'s Encrypt) или устарел движок браузера.<br/><br/>' +
                '<b>Решения:</b><br/>' +
                '1. Откройте сайт по обычному HTTP (без шифрования):<br/>' +
                '<span style="color:#f1c40f;font-size:20px;text-decoration:underline;">http://remapg-movister-354f.twc1.net</span><br/>' +
                '2. Обновите прошивку ТВ в настройках системы.<br/>' +
                '3. Попробуйте обновить приложение браузера в магазине приложений ТВ.';
              document.body.appendChild(div);
            }
          }, 5000);
        ` }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
