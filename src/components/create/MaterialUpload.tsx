import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, WarningCircle, UploadSimple, PencilLine, CheckCircle } from '@phosphor-icons/react';

interface MaterialUploadProps {
  materialText: string;
  uploadedFiles: File[];
  onMaterialTextChange: (text: string) => void;
  onFilesChange: (files: File[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 1; // Max 1 file
const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB total limit

export function MaterialUpload({
  materialText,
  uploadedFiles,
  onMaterialTextChange,
  onFilesChange,
}: MaterialUploadProps) {
  const [uploadError, setUploadError] = useState<string>('');

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadError('');

    // Check file count
    if (uploadedFiles.length + files.length > MAX_FILES) {
      setUploadError(`Voit ladata enintään ${MAX_FILES} tiedoston. (Rajoitus: 5MB kokonaiskoko)`);
      event.target.value = ''; // Reset input
      return;
    }

    // Check individual file sizes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`Tiedosto "${file.name}" on liian suuri (${formatFileSize(file.size)}). Maksimi: ${formatFileSize(MAX_FILE_SIZE)} per tiedosto.`);
        event.target.value = ''; // Reset input
        return;
      }
    }

    // Check total size
    const currentTotalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const newTotalSize = files.reduce((sum, f) => sum + f.size, 0);
    const totalSize = currentTotalSize + newTotalSize;

    if (totalSize > MAX_TOTAL_SIZE) {
      setUploadError(`Tiedostojen yhteiskoko (${formatFileSize(totalSize)}) ylittää rajan (${formatFileSize(MAX_TOTAL_SIZE)}). Pienennä tiedostoja tai valitse vähemmän tiedostoja.`);
      event.target.value = ''; // Reset input
      return;
    }

    onFilesChange([...uploadedFiles, ...files]);
    onMaterialTextChange(''); // Clear text when files are uploaded
    event.target.value = ''; // Reset input for next upload
  };

  const removeFile = (indexToRemove: number) => {
    setUploadError(''); // Clear error when removing files
    onFilesChange(uploadedFiles.filter((_, index) => index !== indexToRemove));
  };

  const getTotalSize = () => {
    return uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
          <span className="inline-flex items-center gap-2">
            <UploadSimple weight="duotone" className="w-5 h-5 text-blue-600" />
            Lataa tiedostoja (PDF, kuva tai tekstitiedosto)
          </span>
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Maksimi: {MAX_FILES} tiedosto, {formatFileSize(MAX_FILE_SIZE)} per tiedosto, {formatFileSize(MAX_TOTAL_SIZE)} yhteensä
        </p>
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.txt,.doc,.docx,image/*"
          multiple
          disabled={uploadedFiles.length >= MAX_FILES}
          className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {uploadError && (
          <Alert variant="destructive" className="mt-3">
            <WarningCircle weight="duotone" className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-green-600 font-medium inline-flex items-center gap-2">
              <CheckCircle weight="duotone" className="w-4 h-4" />
              Valittu {uploadedFiles.length} tiedosto(a) ({formatFileSize(getTotalSize())} yhteensä):
            </p>
            <div className="space-y-1">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="text-sm text-gray-800 dark:text-gray-100 font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 ml-2"
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
        <span className="text-gray-500 dark:text-gray-400 font-medium">TAI</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <div>
        <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
          <span className="inline-flex items-center gap-2">
            <PencilLine weight="duotone" className="w-5 h-5 text-blue-600" />
            Kirjoita materiaali tähän
          </span>
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
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 italic">
            Poista tiedostot käyttääksesi tekstikenttää
          </p>
        )}
      </div>
    </div>
  );
}
