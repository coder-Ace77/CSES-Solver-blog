
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/Logo';
import { LayoutGrid, PlusCircle, ShieldCheck } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <Logo />
        </Link>
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Button variant="ghost" asChild>
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              <LayoutGrid className="mr-2 h-4 w-4" /> Problems
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/submit" className="text-sm font-medium transition-colors hover:text-primary">
              <PlusCircle className="mr-2 h-4 w-4" /> Submit Solution
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin" className="text-sm font-medium transition-colors hover:text-primary">
              <ShieldCheck className="mr-2 h-4 w-4" /> Admin
            </Link>
          </Button>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

