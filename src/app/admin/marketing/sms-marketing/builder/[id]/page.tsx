'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SmsFlowBuilder from '@/components/admin/sms-marketing/SmsFlowBuilder';
import { toast } from 'sonner';

export default function SmsBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [automation, setAutomation] = useState(null);

  const automationId = params.id as string;

  useEffect(() => {
    loadData();
  }, [automationId]);

  const loadData = async () => {
    try {
      // Carregar automação
      if (automationId !== 'new') {
        const response = await fetch(`/api/sms/automations/${automationId}`);
        if (response.ok) {
          const data = await response.json();
          setAutomation(data.automation);
        } else {
          toast.error('Automação não encontrada');
          router.push('/admin/marketing/sms-marketing');
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da automação');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    }>
      {/* Container absoluto para SmsFlowBuilder ocupar viewport completo */}
      <div className="fixed inset-0 top-[60px] sm:top-[64px] lg:top-[73px] left-0 lg:left-24" style={{ zIndex: 1 }}>
        <SmsFlowBuilder
          automationId={automationId}
          initialAutomation={automation}
          onAutomationChange={(updatedAutomation) => setAutomation(updatedAutomation)}
        />
      </div>
    </Suspense>
  );
}
