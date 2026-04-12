import PlayBrowsePageClient from '@/components/play/PlayBrowsePageClient';

export default async function PlayBrowsePageRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const grade = typeof params.grade === 'string' ? params.grade : null;

  return (
    <PlayBrowsePageClient
      initialGradeParam={grade}
    />
  );
}
