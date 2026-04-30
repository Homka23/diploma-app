
import { useRef, useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';

export default function GoogleAuthButton({ onSuccess, onError }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        shape="rectangular"
        size="large"
        width={width}
      />
    </div>
  );
}
