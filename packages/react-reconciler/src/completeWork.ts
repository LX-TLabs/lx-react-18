import { FiberNode } from './fiber'
import { HostComponent, HostRoot, HostText, FunctionComponent } from './workTags'
import { NoFlags, Update } from './fiberFlags'
import {
	appendInitialChild,
	createInstance,
	createTextInstance,
	Instance,
  Container
} from 'hostConfig';

/**
 * 标记更新
 * @param fiber 
 */
const markUpdate = (fiber: FiberNode) => {
	fiber.flags |= Update;
}

/**
 * 将wip的子fiber 挂载的dom append 到 parent中
 * @param parent 
 * @param wip 
 */
const appendAllChildren = (parent: Container, wip: FiberNode) => {
  let node = wip.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 向下遍历
      node.child.return = node
      node = node.child;
      continue
    }

    if (node === wip) {
      return
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === wip) {
        return
      }
      node = node.return
    }
    node.sibling.return = node.return;
    node = node.sibling
  }
}

/**
 * 属性冒泡 标记更新
 * @param wip 
 */
const bubbleProperties = (wip: FiberNode) => {
  let subtreeFlags = NoFlags;
	let child = wip.child;

  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags

    child = child.sibling;
  }
  wip.subtreeFlags |= subtreeFlags
}

/**
 * 递归中的归操作
 * 对于HostComponent来说 mount 就是构建DOM update 就是更新属性
 * @param wip 
 */
export const completeWork = (wip: FiberNode) => {
  const newProps = wip.pendingProps;
	const current = wip.alternate;

  switch (wip.tag) {
    case HostComponent:
      if (current !== null) {
        // 更新
				// TODO: 更新元素属性
				// 不应该在此处调用updateFiberProps，应该跟着判断属性变化的逻辑，在这里打flag
				// 再在commitWork中更新fiberProps，我准备把这个过程留到「属性变化」相关需求一起做
      } else {
        // 创建DOM节点
        const instance = createInstance(wip.type, newProps)
        // 2. 将DOM插入到DOM树中
        appendAllChildren(instance, wip);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
			return null;

    case HostText:
      if (current !== null && wip.stateNode) {
				// update
				const oldText = current.memoizedProps?.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				// 1. 构建DOM
				const instance = createTextInstance(newProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
    case HostRoot:
    case FunctionComponent:
      bubbleProperties(wip);
      return null;
    default:
      if (__DEV__) {
        console.warn('未实现的 completeWork tag', wip.tag);
      }
      break;
  }
}