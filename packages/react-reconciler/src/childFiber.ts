import { FiberNode, createWorkInProgress, createFiberFromElement } from './fiber'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { ReactElement } from 'shared/ReactTypes'
import { Placement, ChildDeletion } from './fiberFlags'
import { Props } from 'shared/ReactTypes';

/**
 * 复用Fiber
 * @param fiber 
 * @param pendingProps 
 */
export const useFiber = (fiber: FiberNode, pendingProps: Props): FiberNode => {
  const clone = createWorkInProgress(fiber, pendingProps)
  clone.index  = 0;
  clone.sibling = null
  return clone
}
export const ChildReconciler = (shouldTrackEffects: boolean) => {
  /**
   * 标记节点更新
   * @param fiber 
   * @returns 
   */
  const placeSingleChild = (fiber: FiberNode) => {
    if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
  }
  /**
   * 删除子节点
   * @param returnFiber 
   * @param childToDelete 
   * @returns 
   */
  const deleteChild = (returnFiber: FiberNode, childToDelete: FiberNode) => {
    if (!shouldTrackEffects) {
      return
    }
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete]
      // 打上删除标记
      returnFiber.flags |= ChildDeletion
    } else {
      deletions.push(childToDelete);
    }
  }
  const deleteRemainingChildren = (returnFiber: FiberNode, currentFirstChild: FiberNode | null) => {
    if (!shouldTrackEffects) {
			return;
		}
    // 对 currentFirstChild 包括其兄弟节点都进行删除操作
    let childToDelete = currentFirstChild
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling
    }
  }
  /**
   * 单节点判断
   * @param returnFiber 
   * @param currentFirstChild 
   * @param element 
   */
  const reconcileSingleElement = (returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElement): FiberNode => {
     // 前：abc 后：a  删除bc
     // 前：a 后：b 删除b、创建a
     // 前：无 后：a 创建a
     // 判断节点是否 可复用 先判断 key 在判断type
     const key = element.key;
     let current = currentFirstChild
     while(current !== null) {
      if (element.key === key) {
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (current.type === element.type) {
              // type 相同 可以复用
              let props = element.props;
              const existing = useFiber(current, props);
              returnFiber.child = existing;
              // 当前节点可复用，其他兄弟节点都删除
              deleteRemainingChildren(returnFiber, current.sibling);
              return existing;
          }
          // key相同但type不同，没法复用。后面的兄弟节点也没有复用的可能性了，都删除
          deleteRemainingChildren(returnFiber, current.sibling);
          break;
        } else {
          if (__DEV__) {
            console.log('未实现的 $$typeof', element.$$typeof)
          }
          break;
        }
      } else {
        // key 不相同 删除当前节点 继续比较
        deleteChild(returnFiber, current);
        current = current.sibling
      }
     }

    // 判断🈚节点可以复用 创建新的节点
    const fiber = createFiberFromElement(element)
    fiber.return = returnFiber;
    return fiber;
  }
  /**
   * reconcileChildFibers 的本质上是通过比较 currentFirstChild（FiberNode） 与 newChild（ReactElement）
   * 生成一个新的Fiber
   * @param returnFiber 
   * @param currentFirstChild 
   * @param newChild 
   * @returns 
   */
  const reconcileChildFibers = (
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any,
	): FiberNode | null => {
    // TODO:

    // newChild 为 JSX
    if (typeof newChild === 'object' && newChild !== null) {
      switch(newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(
            returnFiber,
            currentFirstChild,
            newChild
          ))
      }
    }
    return null 
  }
  return reconcileChildFibers;
}


export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);