import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/forget_password')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/forget_password"!</div>
}
