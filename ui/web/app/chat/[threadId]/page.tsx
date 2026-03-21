import ThreadView from '@/components/chat/thread-view'

interface Props {
  params: Promise<{ threadId: string }>
}

export default async function ThreadPage({ params }: Props) {
  const { threadId } = await params
  return <ThreadView threadId={threadId} />
}
