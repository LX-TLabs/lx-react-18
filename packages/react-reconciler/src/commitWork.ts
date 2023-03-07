import { FiberNode, FiberRootNode } from './fiber'
import { NoFlags, MutationMask, Placement } from './fiberFlags'
import { Container, Instance, insertChildToContainer, appendChildToContainer } from 'hostConfig'
import {
	HostComponent,
	HostRoot,
	HostText,
	FunctionComponent
} from './workTags';

let nextEffect: FiberNode | null = null;

/**
 * 获取当前fiber的父DOM
 * @param finishedWork 
 * @returns 
 */
const getHostParent = (finishedWork: FiberNode): Container | null => {
  let parent = finishedWork.return
  while( parent !== null ) {
    // 根据 tag 判断
    const parentTag = parent.tag;
    if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
    parent = parent.return
  }
  if (__DEV__) {
		console.warn('未找到host parent');
	}
	return null;
}

const getHostSibling = (fiber: FiberNode): Container | null => {
  let node: FiberNode = fiber;

  findSibling: while(true) {
    // 向上遍历
    while(node.sibling === null) {
      const parent = node.return;
      // 遍历到 HostComponent 或者 HostRoot 说明是 父DOM 说明没有兄弟节点
			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}
			node = parent;
    }

    // TODO: 这个判断是不是要加
    // node.sibling.return = no
    node = node.sibling
    while (node.tag !== HostText && node.tag !== HostComponent) {
      if ((node.flags & Placement) !== NoFlags) {
				continue findSibling;
			}
      if (node.child === null) {
				continue findSibling;
			} else {
        // TODO: 这个判断是不是要加
				// node.child.return = node;
				node = node.child;
			}
    }
    // 这个兄弟节点需要是一个不会更新的节点 不然顺序会乱
    if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
  }
}

const insertOrAppendPlacementNodeIntoContainer = (
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) => {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostRoot) {
    if (__DEV__) {
      console.log('insertOrAppendPlacementNodeIntoContainer', 'hostParent', hostParent)
      console.log('insertOrAppendPlacementNodeIntoContainer', 'finishedWork', finishedWork)
    }
    if (before) {
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
  }
  // 如果不是 则说明可能是 Function Component
  const child = finishedWork.child
  if (child !== null) {
    insertOrAppendPlacementNodeIntoContainer(child, hostParent, before)
    let sibling = child.sibling;
    while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent, before);
			sibling = sibling.sibling;
		}
  }
}

const commitPlacement = (finishedWork: FiberNode) => {
  if (__DEV__) {
		console.warn('执行Placement操作', finishedWork);
	}
  // parent DOM
	const hostParent = getHostParent(finishedWork);

  // host sibling
	const sibling = getHostSibling(finishedWork);

  // finishedWork ~~ DOM
	if (hostParent !== null) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}

}

const commitMutationEffectOnFiber = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
  if (__DEV__) {
		console.warn('执行 commitMutationEffectOnFiber', finishedWork);
	}

  const flags = finishedWork.flags;

  //  根据 flags 不同进行更新
  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
}

/**
 * commitMutationEffects
 * 从根节点向下遍历 判断当前Fiber 是否有更新
 * @param finishedWork 
 * @param root 
 */
export const commitMutationEffects = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
  if (__DEV__) {
		console.warn('执行 commitMutationEffects', finishedWork);
	}

  nextEffect = finishedWork;

  while(nextEffect !== null) {
    // 向下遍历
    let child: FiberNode | null = nextEffect.child
    // 如果当前 Effect 存在更新 并且 有子Fiber 向下遍历
    if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
      nextEffect = child
    } else {
      // 向上遍历 开启更新
      /**
       * 为什么要这样子呢
       * 很简单 你这么理解 先更新完子节点 那么父节点的child 就是这些更新完成的子节点
       */
      up: while(nextEffect !== null) {
        commitMutationEffectOnFiber(nextEffect, root)
        // 更新完当前fiber 找到其 兄弟Fiber 进行更新
        const sibling: FiberNode | null = nextEffect.sibling;
        if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
        nextEffect = nextEffect.return
      }
    }
  }
}