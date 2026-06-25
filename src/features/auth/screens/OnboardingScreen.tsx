import { Button, Carousel, Typography } from 'antd';
import { useRef, useState } from 'react';
import type { CarouselRef } from 'antd/es/carousel';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../store/userStore';

interface Slide {
  emoji: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    emoji: '🧾',
    title: 'Registra gastos al instante',
    description: 'Anota lo que gastas con tus amigos, familia o roomies en segundos.',
  },
  {
    emoji: '⚖️',
    title: 'Divide de forma justa',
    description: 'Reparte gastos en partes iguales, por porcentaje, montos exactos o shares.',
  },
  {
    emoji: '✅',
    title: 'Salda cuentas fácil',
    description: 'Te decimos quién le debe a quién con el mínimo número de pagos.',
  },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const carouselRef = useRef<CarouselRef>(null);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  const handleFinish = () => {
    completeOnboarding();
    navigate('/profile-setup', { replace: true });
  };

  const handleNext = () => {
    if (pageIndex < slides.length - 1) {
      carouselRef.current?.next();
    } else {
      handleFinish();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Carousel ref={carouselRef} afterChange={setPageIndex} dots={{ className: 'onboarding-dots' }}>
        {slides.map((slide) => (
          <div key={slide.title}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '70vh',
                padding: '0 32px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 96, marginBottom: 24 }}>{slide.emoji}</div>
              <Typography.Title level={4}>{slide.title}</Typography.Title>
              <Typography.Paragraph type="secondary">{slide.description}</Typography.Paragraph>
            </div>
          </div>
        ))}
      </Carousel>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 24px 24px',
          marginTop: 'auto',
        }}
      >
        <Button type="text" onClick={handleFinish}>
          Saltar
        </Button>
        <Button type="primary" onClick={handleNext}>
          {pageIndex === slides.length - 1 ? 'Empezar' : 'Siguiente'}
        </Button>
      </div>
    </div>
  );
}
