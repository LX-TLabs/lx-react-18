import { FiberNode } from './fiber'
export const ChildReconciler = (shouldTrackEffects: boolean) => {
  const reconcileChildFibers = (
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any,
	): FiberNode | null => {
    // TODO:
    return null 
  }
  return reconcileChildFibers;
}


export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);