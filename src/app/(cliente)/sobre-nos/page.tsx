import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nós | SushiWorld',
  description: 'Há mais de 5 anos levamos o verdadeiro sabor da culinária japonesa até à sua casa com todo o cuidado, frescor e dedicação.',
};

export default function SobreNosPage() {
  return (
    <div className="bg-gray-50 py-12 lg:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-white p-8 lg:p-12 rounded-lg shadow-md">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8 text-center">
            🍣 Sobre Nós – SushiWorld Santa Iria
          </h1>
          
          <div className="text-gray-700 space-y-6 text-base lg:text-lg leading-relaxed">
            <p className="text-lg lg:text-xl">
              No SushiWorld Santa Iria, há mais de 5 anos levamos o verdadeiro sabor da culinária japonesa até à sua casa com todo o cuidado, frescor e dedicação. Somos especialistas em delivery de sushi em Santa Iria, oferecendo uma experiência autêntica, prática e cheia de sabor.
            </p>
            
            <p>
              Cada peça é preparada com ingredientes selecionados e de alta qualidade, sempre com amor e compromisso em cada detalhe. O resultado? Sushi fresco, saboroso e entregue rapidamente, mantendo o padrão que nos tornou referência na região.
            </p>
            
            <p>
              Se procura comida japonesa em Santa Iria com qualidade e confiança, o SushiWorld Santa Iria é a escolha certa. Peça já e descubra porque há tantos anos somos o delivery de sushi preferido da cidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
