import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_sidebar/Homepage')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/Homepage"!</div>
}
