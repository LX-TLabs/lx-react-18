import { Props, Key, ReactElement } from 'shared/ReactTypes';
import { WorkTag, FunctionComponent, HostComponent } from './workTags'
import { NoFlags, Flags } from './fiberFlags'

export class FiberNode {
  /**
   * 用户初始化Props
   */
  pendingProps: Props
  /**
   * 计算完成的Props
   */
   memoizedProps: Props | null
  key: Key;
  /**
   * 对于 HostComponent 来说  stateNode 就是 HTML Elememnt
   * 对于 HostRoot 来说 stateNode 指向 FiberRootNode
   * // TODO:
   * 对于FunctionComponent 
   */
  stateNode: any;
  /**
   * TODO:
   * 对于 HostComponent 来说  type 就是 HTML Elememnt 标签类型 所以是string
   * 对于 对于FunctionComponent 来说  type 就是整个函数
   */
  type: any;

  /**
   * 父节点
   */
  return: FiberNode | null;
  /**
   * 兄弟节点
   */
	sibling: FiberNode | null;
  /**
   * 子节点
   */
	child: FiberNode | null;
  /**
   * index
   */
	index: number;
  /**
   * 双缓冲fiber结构关键
   */
  alternate: FiberNode | null
  /**
   * 当前节点的 flags
   */
  flags: Flags
  /**
   * 子节点的 flags集合
   */
  subtreeFlags: Flags
  /**
   * 待删除的节点集合
   */
  deletions: FiberNode[] | null;
  tag: WorkTag;


  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 实例
    this.key = key
    this.tag = tag
    this.stateNode = null
    this.type = null;

    // 树结构
    this.child = null
    this.sibling = null
    this.return = null
    this.index = 0

    // this.ref = null

    // 状态
    this.pendingProps = pendingProps
    this.memoizedProps = null

    // 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;

    // 调度
		// this.lanes = NoLane;
		// this.childLanes = NoLanes;

		this.alternate = null;
  }
}

/**
 * 根节点
 */
export class FiberRootNode {
  /**
   * // TODO: 变更 
   * 容器指向
   */
  container: any;
  /**
   * 当前指向的FiberNode
   */
  current: FiberNode
  /**
   * 任务结束的 FiberNode
   */
  finishedWork: FiberNode | null;
  constructor(container: any, hostRootFiber: FiberNode) {
    this.container = container
    this.current = hostRootFiber
    hostRootFiber.stateNode = this;
    this.finishedWork = null;


    // TODO: 补充
  }
}

/**
 * ReactElememt 转换成 FiberNode
 * @param element 
 */
export function createFiberFromElement(
	element: ReactElement,
): FiberNode {
  let fiberTag: WorkTag = FunctionComponent
  const { type, props, key, } = element
  if (typeof type === 'string') {
    fiberTag = HostComponent
  } else if (typeof type !== 'function') {
		console.error('未定义的type类型', element);
	}
 
  const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	// fiber.lanes = lanes;

	return fiber;
}

/**
 * 创建 WIP FiberNode
 * @param current 
 * @param pendingProps 
 */
export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
  let wip = current.alternate

  if (wip === null) {
    wip = new FiberNode(current.tag, pendingProps, current.key)
    wip.type = current.type
    wip.stateNode = current.stateNode

    // 建立双缓冲树
    wip.alternate = current
    current.alternate = wip
  } else {
    // update
		wip.pendingProps = pendingProps;
    wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
    wip.deletions = null;
		wip.type = current.type;
  }
	wip.child = current.child;
  // TODO: 完善
  // 数据
	wip.memoizedProps = current.memoizedProps;

  return wip
}