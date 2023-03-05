
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { HostRoot } from './workTags';
import { beginWork } from './beginWork'
import { completeWork } from './completeWork'

let workInProgress: FiberNode | null = null;

const prepareFreshStack = (root: FiberRootNode) =>  {
	workInProgress = createWorkInProgress(root.current, {});
}

/**
 * 当前fiber 找到 rootFiberNode
 * @param fiber 
 * @returns 
 */
const markUpdateFormFiberToRoot = (fiber: FiberNode) => {
  let current = fiber
  let parent = current.return;
  while (parent !== null) {
    current = parent;
    parent = current.return
  }
  if (current.tag === HostRoot) {
    return current.stateNode
  }
}

const completeUnitOfWork = (fiber: FiberNode) => {
  let node: FiberNode | null = fiber;

  do {
    completeWork(node);
    const sibling = node.sibling;
		if (sibling) {
			workInProgress = sibling;
			return;
		}
    node = node.return;
    workInProgress = node;
  } while(node !== null)
}

const performUnitOfWork = (fiber: FiberNode) => {
  const next = beginWork(fiber)
  fiber.memoizedProps = fiber.pendingProps;


  if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

const workLoop = () => {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * 同步调度入口
 * @param root 
 */
export const performSyncWorkOnRoot = (root: FiberRootNode) => {
  // 初始化 创建wip
	prepareFreshStack(root);

  // 递归循环
  do {
    try {
      workLoop();
      break;
    } catch(e) {
      if (__DEV__) {
				console.error('workLoop 发生错误', e);
			}
			workInProgress = null;
    }
  } while(true)

  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork;

  // commitRoot阶段
}

/**
 * 调度节点入口
 * @param root 
 */
export const ensureRootIsScheduled = (root: FiberRootNode) => {
  // TODO:
  performSyncWorkOnRoot(root)
}

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
  // 调度功能

  // ReactDOM.createRoot.render 中的调度入口是 root
  // 但是其他类型的更新是 当前fiber触发的调度
  // 所以需要根据当前fiber 找到root
  const root = markUpdateFormFiberToRoot(fiber);

  ensureRootIsScheduled(root);
}