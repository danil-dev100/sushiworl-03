'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FlowBuilder from '@/components/admin/email-marketing/FlowBuilder';
import { toast } from 'sonner';

export default function FlowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [flow, setFlow] = useState(null);
  const [templates, setTemplates] = useState([]);

  const flowId = params.id as string;

  useEffect(() => {
    loadData();
  }, [flowId]);

  const loadData = async () => {
    try {
      // Carregar fluxo
      if (flowId !== 'new') {
        const flowResponse = await fetch(`/api/email-marketing/flows/${flowId}`);
        if (flowResponse.ok) {
          const flowData = await flowResponse.json();
          setFlow(flowData.flow);
        } else {
          toast.error('Fluxo não encontrado');
          router.push('/admin/marketing/email-marketing');
          return;
        }
      }

      // Carregar templates
      const templatesResponse = await fetch('/api/email-marketing/templates');
      console.log('Templates response status:', templatesResponse.status);
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        console.log('Templates data:', templatesData);
        console.log('Templates count:', templatesData.templates?.length || 0);
        setTemplates(templatesData.templates || []);
      } else {
        console.error('Erro ao carregar templates:', templatesResponse.status);
        const errorData = await templatesResponse.text();
        console.error('Error details:', errorData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do fluxo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div>
      </div>
    }>
      <FlowBuilder
        flowId={flowId}
        initialFlow={flow}
        templates={templates}
        onFlowChange={(updatedFlow) => setFlow(updatedFlow)}
      />
    </Suspense>
  );
}
