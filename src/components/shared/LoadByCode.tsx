import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoadByCodeProps {
  code: string;
  loading: boolean;
  onCodeChange: (code: string) => void;
  onLoad: () => void;
}

export function LoadByCode({ code, loading, onCodeChange, onLoad }: LoadByCodeProps) {
  return (
    <div>
      <label className="block text-lg font-bold mb-3 text-gray-800">
        🔑 Lataa kysymyssarja koodilla
      </label>
      <div className="flex gap-2">
        <Input
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          placeholder="Syötä koodi (esim. ABC123)"
          className="flex-1 text-lg"
          maxLength={6}
        />
        <Button onClick={onLoad} disabled={code.length !== 6 || loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lataa'}
        </Button>
      </div>
    </div>
  );
}
