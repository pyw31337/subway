import MapBackground from "@/components/MapBackground";
import Logo from "@/components/Logo";

export default function Home() {
    return (
        <main className="relative w-full h-screen overflow-hidden">
            <MapBackground />
            <Logo />
        </main>
    );
}
