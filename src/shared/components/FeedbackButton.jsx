import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { FeedbackModal } from '@/shared/components/FeedbackModal';
import { MessageCircle } from 'lucide-react';

export const FeedbackButton = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      // Enviar feedback a la API
      const response = await fetch('https://www.tmeduca.org/issuse_api/nexam_issuse.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: feedbackData.title,
          body: feedbackData.description,
          email: feedbackData.email || null,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar el feedback');
      }

      alert('¡Gracias por tu comentario! Tu reporte ha sido enviado exitosamente.');
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      throw error;
    }
  };

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        size="icon"
        aria-label="Comentarios y sugerencias"
      >
        <MessageCircle className="w-5 h-5" />
      </Button>

      <FeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
};