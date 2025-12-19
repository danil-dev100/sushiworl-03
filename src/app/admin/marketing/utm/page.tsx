'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function UtmPage() {
  const [baseUrl, setBaseUrl] = useState('https://sushiworld.pt');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [copied, setCopied] = useState(false);

  const generateUrl = () => {
    const params = new URLSearchParams();

    if (utmSource) params.append('utm_source', utmSource);
    if (utmMedium) params.append('utm_medium', utmMedium);
    if (utmCampaign) params.append('utm_campaign', utmCampaign);
    if (utmTerm) params.append('utm_term', utmTerm);
    if (utmContent) params.append('utm_content', utmContent);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const finalUrl = generateUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    toast.success('URL copiada para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    {
      name: 'Google Ads',
      values: {
        source: 'google',
        medium: 'cpc',
        campaign: '',
      },
    },
    {
      name: 'Facebook Ads',
      values: {
        source: 'facebook',
        medium: 'cpc',
        campaign: '',
      },
    },
    {
      name: 'Instagram',
      values: {
        source: 'instagram',
        medium: 'social',
        campaign: '',
      },
    },
    {
      name: 'Email',
      values: {
        source: 'email',
        medium: 'email',
        campaign: 'newsletter',
      },
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setUtmSource(preset.values.source);
    setUtmMedium(preset.values.medium);
    setUtmCampaign(preset.values.campaign);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gerador de UTM Parameters
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Crie URLs rastreáveis para suas campanhas de marketing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Presets */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Templates Rápidos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Base *
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://seusite.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* UTM Parameters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Origem da Campanha * (utm_source)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  Ex: google, facebook, newsletter
                </span>
              </label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="google"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meio * (utm_medium)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  Ex: cpc, email, social
                </span>
              </label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="cpc"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome da Campanha * (utm_campaign)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  Ex: promocao_verao, black_friday
                </span>
              </label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="promocao_verao"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Termo (utm_term)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  Opcional - Palavras-chave pagas
                </span>
              </label>
              <input
                type="text"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
                placeholder="sushi+delivery"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conteúdo (utm_content)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  Opcional - Diferencia anúncios similares
                </span>
              </label>
              <input
                type="text"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="banner_topo"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Generated URL */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                URL Gerada
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 break-all font-mono">
                  {finalUrl}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar URL
                    </>
                  )}
                </button>
                <a
                  href={finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                📊 Sobre UTM Parameters
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-400">
                UTM parameters permitem rastrear a origem e performance das suas campanhas de marketing.
                Todos os cliques nesta URL serão registrados no sistema com a origem identificada.
              </p>
            </div>

            {/* Best Practices */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                💡 Boas Práticas
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Use minúsculas consistentemente</li>
                <li>• Evite espaços (use _ ou -)</li>
                <li>• Seja descritivo mas conciso</li>
                <li>• Mantenha um padrão de nomenclatura</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
