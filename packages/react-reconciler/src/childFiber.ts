import { FiberNode, createWorkInProgress, createFiberFromElement } from './fiber'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { ReactElement } from 'shared/ReactTypes'
import { Placement, ChildDeletion } from './fiberFlags'
import { Props } from 'shared/ReactTypes';
import { HostText } from './workTags';

/**
 * mount/reconcile只负责 Placement(插入)/Placement(移动)/ChildDeletion(删除)
 * 更新（文本节点内容更新、属性更新）在completeWork中，对应Update flag
 */

 type ExistingChildren = Map<string | number, FiberNode>;

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

  const reconcileSingleTextNode = (returnFiber: FiberNode, currentFirstChild: FiberNode | null, content: string) => {
    let current = currentFirstChild
    // 前：b 后：a
		// TODO: 前：abc 后：a
		// TODO: 前：bca 后：a
    if (current !== null) {
      if (current.tag === HostText) {
        // 可以复用
				const existing = useFiber(current, { content });
        returnFiber.child = existing;
        deleteRemainingChildren(returnFiber, current.sibling);
				return existing;
      }
      // 不能复用
			deleteChild(returnFiber, current);
      current = current.sibling
    }
    const created = new FiberNode(HostText, { content }, null);
		created.return = returnFiber;
		return created;
  }

  /**
   * 
   * @param returnFiber 
   * @param existingChildren 
   * @param index 
   * @param element 
   */
  const updateFromMap = (returnFiber: FiberNode, existingChildren: ExistingChildren, index: number, element: any ) => {
    const keyToUse = element.key !== null ? element.key : index

    const before = existingChildren.get(keyToUse);

    // 处理文本节点
    if (typeof element === 'string' || typeof element === 'number') {
      if (before) {
        // fiber key相同，如果type也相同，则可复用
        if (before.tag === HostText) {
          // 这个key 可以复用的话 删除 Map 中关于key的记录
          existingChildren.delete(keyToUse)
          return useFiber(before, { content: element + '' });
        }
      }
      return new FiberNode(HostText, { content: element }, null);
    }

    // 处理ReactElement
    if (typeof element === 'object' && element !== null) {
      switch(element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (before) {
            // fiber key相同，如果type也相同，则可复用
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
          }
          return  createFiberFromElement(element);
      }
    }

    return null
  }

  /**
   * 多节点Diff
   * @param returnFiber 
   * @param currentFirstChild 
   * @param newChild 
   */
  const reconcileChildrenArray = (returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: any[])=> {
    // 遍历到的最后一个可复用fiber在before中的index
		let lastPlacedIndex = 0;
		// 创建的最后一个fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个fiber
		let firstNewFiber: FiberNode | null = null;
  
    // 遍历前的准备工作，将current保存在map中
    const existingChildren: ExistingChildren = new Map();
    let current = currentFirstChild
    while (current !== null) {
      const keyToUse = current.key !== null ? current.key : current.index;
      existingChildren.set(keyToUse, current)
      current = current.sibling
    }
    // 遍历流程
    for (let i = 0; i < newChild.length; i++) {
      const after = newChild[i];

      // after对应的fiber，可能来自于复用，也可能是新建
      const newFiber = updateFromMap(returnFiber, existingChildren, i, after);

      /**
			 * 考虑如下情况：
			 * 更新前：你好{123}
			 * 更新后：你好{null}
			 *   或者：你好{false}
			 *   或者：你好{undefined}
			 */
			if (newFiber === null) {
				continue;
			}

      newFiber.index = i;
      newFiber.return = returnFiber;

      if (lastNewFiber === null) {
        lastNewFiber = firstNewFiber = newFiber
      } else {
        lastNewFiber.sibling = newFiber
        lastNewFiber = lastNewFiber.sibling
      }

      if (!shouldTrackEffects) {
				continue;
			}

      const current = newFiber.alternate;
      if (current !== null) {
        const oldIndex = current.index;
        // 插入或者移动的判断
        // 最后一个可复用fiber在 current中 index < lastPlacedIndex 标记更新
        if (current.index < lastPlacedIndex) {
          newFiber.flags |= Placement;
          continue;
        } else {
          lastPlacedIndex = current.index
        }
      } else {
        // fiber不能复用，插入新节点
        newFiber.flags |= Placement;
      }
    }

    // 遍历后的收尾工作，标记existingChildren中剩余的删除
    existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		return firstNewFiber;
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

      if (Array.isArray(newChild)) {
        return reconcileChildrenArray(
					returnFiber,
					currentFirstChild,
					newChild,
				);
      }
    }

    // newChild 为文本类型节点
    if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(
					returnFiber,
					currentFirstChild,
					newChild + '',
				)
			);
		}

    // 其他情况全部视为删除旧的节点
		deleteRemainingChildren(returnFiber, currentFirstChild);
    return null 
  }
  return reconcileChildFibers;
}


export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);