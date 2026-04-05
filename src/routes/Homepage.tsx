import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/Homepage')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/Homepage"!</div>
}
