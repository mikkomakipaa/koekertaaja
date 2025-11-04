import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface MaterialUploadProps {
  materialText: string;
  uploadedFiles: File[];
  onMaterialTextChange: (text: string) => void;
  onFilesChange: (files: File[]) => void;
}

export function MaterialUpload({
  materialText,
  uploadedFiles,
  onMaterialTextChange,
  onFilesChange,
}: MaterialUploadProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    onFilesChange([...uploadedFiles, ...files]);
    onMaterialTextChange(''); // Clear text when files are uploaded
  };

  const removeFile = (indexToRemove: number) => {
    onFilesChange(uploadedFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-lg font-bold mb-3 text-gray-800">
          📁 Lataa tiedostoja (PDF, kuva tai tekstitiedosto)
        </label>
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.txt,.doc,.docx,image/*"
          multiple
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4"
        />
        {uploadedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-green-600 font-medium">
              ✓ Valittu {uploadedFiles.length} tiedosto(a):
            </p>
            <div className="space-y-1">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-gray-500 font-medium">TAI</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <div>
        <label className="block text-lg font-bold mb-3 text-gray-800">
          ✍️ Kirjoita materiaali tähän
        </label>
        <Textarea
          value={materialText}
          onChange={(e) => {
            onMaterialTextChange(e.target.value);
            if (e.target.value.trim()) {
              onFilesChange([]); // Clear files when text is entered
            }
          }}
          placeholder="Esim. kirjoita tekstikappale, sanalistoja, kielioppisääntöjä tai muu materiaali josta haluat kysymyksiä..."
          className="min-h-48 text-base"
          disabled={uploadedFiles.length > 0}
        />
        {uploadedFiles.length > 0 && (
          <p className="mt-2 text-sm font-medium text-gray-700 italic">
            Poista tiedostot käyttääksesi tekstikenttää
          </p>
        )}
      </div>
    </div>
  );
}
