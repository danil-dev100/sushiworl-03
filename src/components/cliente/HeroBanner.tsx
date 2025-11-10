import Image from 'next/image';

export default function HeroBanner() {
  return (
    <section className="relative w-full min-h-[50vh] md:min-h-[60vh] flex flex-col items-center justify-center bg-cover bg-center">
      <Image
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNzMX6lMna6nX8TjJy5jY_Kv-JczpymR3HD2gGTMwfjEinIlR9ziFO_zQV8AKcSbYx7BEsgrBWBOob-nNOaeEvjrEm8TeNmtAA6oPavzl-eLCGbkwcG_4lWfdccNsy0jWWql6Dj1lU-q9Jxwc2RN0B4GkYX93CFfR-YK7uWhLBAASkyFwY5K3FR_0bx5w_AcA95n3eywQvECREh3WvaQEj1-KUh7BC_f8z0zde_LUz5k83DP9ryssaU6GFpGrZLUcnYnhKfENfyDc"
        alt="SushiWorld - O Sabor do Japão na Sua Casa"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-background-light/80 dark:bg-background-dark/80"></div>
      <div className="relative z-10 text-center p-6 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight whitespace-nowrap">
          SushiWorld: O Sabor do Japão na Sua Casa
        </h1>
      </div>
    </section>
  );
}