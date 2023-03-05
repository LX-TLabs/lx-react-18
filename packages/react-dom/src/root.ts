import { Container } from './hostConfig'
import { ReactElement } from 'shared/ReactTypes'
import { createContainer, updateContainer } from 'react-reconciler/src/fiberReconciler'


/**
 * render阶段的入口
 * @param container 
 * ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
 */
export const createRoot = (container: Container) => {
  const root = createContainer(container)
  return {
    render(element: ReactElement) {
      return updateContainer(element, root);
    }
  }
}