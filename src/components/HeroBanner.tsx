import Image from 'next/image';

export default function HeroBanner() {
  return (
    <section className="relative w-full min-h-[calc(100vh-73px)] flex flex-col items-center justify-center bg-cover bg-center">
      <Image
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNzMX6lMna6nX8TjJy5jY_Kv-JczpymR3HD2gGTMwfjEinIlR9ziFO_zQV8AKcSbYx7BEsgrBWBOob-nNOaeEvjrEm8TeNmtAA6oPavzl-eLCGbkwcG_4lWfdccNsy0jWWql6Dj1lU-q9Jxwc2RN0B4GkYX93CFfR-YK7uWhLBAASkyFwY5K3FR_0bx5w_AcA95n3eywQvECREh3WvaQEj1-KUh7BC_f8z0zde_LUz5k83DP9ryssaU6GFpGrZLUcnYnhKfENfyDc"
        alt="SushiWorld - O Sabor do Japão na Sua Casa"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-background-light/80 dark:bg-background-dark/80"></div>
      <div className="relative z-10 text-center p-6">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary tracking-tight">
          SushiWorld: O Sabor do Japão na Sua Casa
        </h1>
      </div>
      <div className="absolute bottom-4 left-0 right-0 p-4">
        <p className="text-primary text-center text-xs md:text-sm font-medium">
          Alergias alimentares ou necessidades dietéticas especiais: Antes de realizar o seu pedido, por favor contate diretamente o restaurante.
        </p>
      </div>
    </section>
  );
}
