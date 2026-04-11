import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { createElement, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import {
  clearSelectedSchoolFromStorage,
  readSelectedSchoolFromStorage,
  SELECTED_SCHOOL_STORAGE_KEY,
  useSelectedSchool,
  writeSelectedSchoolToStorage,
} from '@/hooks/useSelectedSchool';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

class ThrowingLocalStorageMock extends LocalStorageMock {
  override getItem(_key: string): string | null {
    throw new Error('storage unavailable');
  }

  override setItem(_key: string, _value: string): void {
    throw new Error('storage unavailable');
  }

  override removeItem(_key: string): void {
    throw new Error('storage unavailable');
  }
}

type RenderSnapshot = {
  schoolId: string | null;
  schoolName: string | null;
  isLoaded: boolean;
};

type HookApi = ReturnType<typeof useSelectedSchool>;
type LooseGlobal = typeof globalThis & Record<string, unknown>;

class TestNode {
  nodeType: number;
  nodeName: string;
  ownerDocument: TestDocument;
  parentNode: TestNode | null = null;
  childNodes: TestNode[] = [];
  namespaceURI = 'http://www.w3.org/1999/xhtml';

  constructor(nodeType: number, nodeName: string, ownerDocument: TestDocument) {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.ownerDocument = ownerDocument;
  }

  appendChild(node: TestNode) {
    this.childNodes.push(node);
    node.parentNode = this;
    return node;
  }

  removeChild(node: TestNode) {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) {
      this.childNodes.splice(index, 1);
    }
    node.parentNode = null;
    return node;
  }

  insertBefore(node: TestNode, before: TestNode | null) {
    if (!before) {
      return this.appendChild(node);
    }

    const index = this.childNodes.indexOf(before);
    if (index === -1) {
      return this.appendChild(node);
    }

    this.childNodes.splice(index, 0, node);
    node.parentNode = this;
    return node;
  }

  addEventListener() {}

  removeEventListener() {}
}

class TestElement extends TestNode {
  tagName: string;
  style: Record<string, string> = {};
  attributes = new Map<string, string>();
  nodeValue: string | null = null;

  constructor(tagName: string, ownerDocument: TestDocument) {
    super(1, tagName.toUpperCase(), ownerDocument);
    this.tagName = tagName.toUpperCase();
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
}

class TestTextNode extends TestNode {
  nodeValue: string;

  constructor(text: string, ownerDocument: TestDocument) {
    super(3, '#text', ownerDocument);
    this.nodeValue = text;
  }
}

class TestDocument extends TestNode {
  documentElement: TestElement;
  body: TestElement;
  defaultView: typeof globalThis;
  activeElement: TestElement | null = null;

  constructor() {
    super(9, '#document', null as unknown as TestDocument);
    this.ownerDocument = this;
    this.defaultView = globalThis;
    this.documentElement = new TestElement('html', this);
    this.body = new TestElement('body', this);
  }

  createElement(tagName: string) {
    return new TestElement(tagName, this);
  }

  createTextNode(text: string) {
    return new TestTextNode(text, this);
  }
}

function HookSnapshot() {
  const { schoolId, schoolName, isLoaded } = useSelectedSchool();

  return createElement(
    'output',
    null,
    JSON.stringify({
      schoolId,
      schoolName,
      isLoaded,
    })
  );
}

function setupClientDom() {
  const looseGlobal = globalThis as unknown as LooseGlobal;
  const previousWindow = looseGlobal.window;
  const previousDocument = looseGlobal.document;
  const previousNavigator = looseGlobal.navigator;
  const previousHTMLElement = looseGlobal.HTMLElement;
  const previousElement = looseGlobal.Element;
  const previousNode = looseGlobal.Node;
  const previousText = looseGlobal.Text;
  const previousHtmlIFrameElement = looseGlobal.HTMLIFrameElement;

  const document = new TestDocument();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: globalThis,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    writable: true,
    value: document,
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    value: { userAgent: 'node.js' } as Navigator,
  });
  Object.defineProperty(globalThis, 'HTMLElement', {
    configurable: true,
    writable: true,
    value: TestElement,
  });
  Object.defineProperty(globalThis, 'Element', {
    configurable: true,
    writable: true,
    value: TestElement,
  });
  Object.defineProperty(globalThis, 'Node', {
    configurable: true,
    writable: true,
    value: TestNode,
  });
  Object.defineProperty(globalThis, 'Text', {
    configurable: true,
    writable: true,
    value: TestTextNode,
  });
  Object.defineProperty(globalThis, 'HTMLIFrameElement', {
    configurable: true,
    writable: true,
    value: class HTMLIFrameElement {},
  });

  return {
    document,
    cleanup: () => {
      if (previousWindow === undefined) {
        Reflect.deleteProperty(looseGlobal, 'window');
      } else {
        looseGlobal.window = previousWindow;
      }

      if (previousDocument === undefined) {
        Reflect.deleteProperty(looseGlobal, 'document');
      } else {
        looseGlobal.document = previousDocument;
      }

      if (previousNavigator === undefined) {
        Reflect.deleteProperty(looseGlobal, 'navigator');
      } else {
        looseGlobal.navigator = previousNavigator;
      }

      if (previousHTMLElement === undefined) {
        Reflect.deleteProperty(looseGlobal, 'HTMLElement');
      } else {
        looseGlobal.HTMLElement = previousHTMLElement;
      }

      if (previousElement === undefined) {
        Reflect.deleteProperty(looseGlobal, 'Element');
      } else {
        looseGlobal.Element = previousElement;
      }

      if (previousNode === undefined) {
        Reflect.deleteProperty(looseGlobal, 'Node');
      } else {
        looseGlobal.Node = previousNode;
      }

      if (previousText === undefined) {
        Reflect.deleteProperty(looseGlobal, 'Text');
      } else {
        looseGlobal.Text = previousText;
      }

      if (previousHtmlIFrameElement === undefined) {
        Reflect.deleteProperty(looseGlobal, 'HTMLIFrameElement');
      } else {
        looseGlobal.HTMLIFrameElement = previousHtmlIFrameElement;
      }
    },
  };
}

async function flushEffects() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function HookProbe(props: {
  onRender: (snapshot: RenderSnapshot) => void;
  onApi: (api: HookApi) => void;
}) {
  const api = useSelectedSchool();

  props.onRender({
    schoolId: api.schoolId,
    schoolName: api.schoolName,
    isLoaded: api.isLoaded,
  });

  useEffect(() => {
    props.onApi(api);
  }, [api, props]);

  return createElement('div');
}

describe('useSelectedSchool storage helpers', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('persists, reads, and clears the selected school', () => {
    const stored = writeSelectedSchoolToStorage('school-1', 'Mäntymäen koulu');

    assert.deepStrictEqual(stored, {
      schoolId: 'school-1',
      schoolName: 'Mäntymäen koulu',
    });
    assert.deepStrictEqual(readSelectedSchoolFromStorage(), {
      schoolId: 'school-1',
      schoolName: 'Mäntymäen koulu',
    });

    assert.strictEqual(clearSelectedSchoolFromStorage(), true);
    assert.strictEqual(readSelectedSchoolFromStorage(), null);
  });

  it('returns null for invalid stored data', () => {
    globalThis.localStorage?.setItem(
      SELECTED_SCHOOL_STORAGE_KEY,
      JSON.stringify({ schoolId: 'school-1' })
    );

    assert.strictEqual(readSelectedSchoolFromStorage(), null);
  });

  it('returns null for malformed stored JSON', () => {
    globalThis.localStorage?.setItem(SELECTED_SCHOOL_STORAGE_KEY, '{bad json');

    assert.strictEqual(readSelectedSchoolFromStorage(), null);
  });

  it('handles unavailable storage gracefully', () => {
    (globalThis as { localStorage?: Storage }).localStorage =
      new ThrowingLocalStorageMock() as unknown as Storage;

    assert.strictEqual(
      writeSelectedSchoolToStorage('school-2', 'Kallion koulu'),
      null
    );
    assert.strictEqual(readSelectedSchoolFromStorage(), null);
    assert.strictEqual(clearSelectedSchoolFromStorage(), false);
  });
});

describe('useSelectedSchool lifecycle', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('keeps isLoaded false on the initial render without accessing window', () => {
    Reflect.deleteProperty(globalThis as unknown as LooseGlobal, 'window');

    const html = renderToString(createElement(HookSnapshot));

    assert.match(
      html,
      /&quot;schoolId&quot;:null,&quot;schoolName&quot;:null,&quot;isLoaded&quot;:false/
    );
  });

  it('loads from storage after mount, persists across hook instances, and clears cleanly', async () => {
    const { document, cleanup } = setupClientDom();
    const container = document.createElement('div');
    document.body.appendChild(container);

    globalThis.localStorage?.setItem(
      SELECTED_SCHOOL_STORAGE_KEY,
      JSON.stringify({
        schoolId: 'school-initial',
        schoolName: 'Aurinkolahden koulu',
      })
    );

    const { createRoot } = await import('react-dom/client');
    const { flushSync } = await import('react-dom');

    try {
      const firstSnapshots: RenderSnapshot[] = [];
      let firstApi: HookApi | null = null;
      const firstRoot = createRoot(container as never);

      flushSync(() => {
        firstRoot.render(
          createElement(HookProbe, {
            onRender: (snapshot) => firstSnapshots.push(snapshot),
            onApi: (api) => {
              firstApi = api;
            },
          })
        );
      });

      assert.deepStrictEqual(firstSnapshots[0], {
        schoolId: null,
        schoolName: null,
        isLoaded: false,
      });

      await flushEffects();

      assert.ok(firstApi);
      assert.deepStrictEqual(firstSnapshots.at(-1), {
        schoolId: 'school-initial',
        schoolName: 'Aurinkolahden koulu',
        isLoaded: true,
      });

      flushSync(() => {
        firstApi?.setSchool('school-next', 'Kallion koulu');
      });

      await flushEffects();
      firstRoot.unmount();

      const secondSnapshots: RenderSnapshot[] = [];
      let secondApi: HookApi | null = null;
      const secondRoot = createRoot(container as never);

      flushSync(() => {
        secondRoot.render(
          createElement(HookProbe, {
            onRender: (snapshot) => secondSnapshots.push(snapshot),
            onApi: (api) => {
              secondApi = api;
            },
          })
        );
      });

      await flushEffects();

      assert.deepStrictEqual(secondSnapshots.at(-1), {
        schoolId: 'school-next',
        schoolName: 'Kallion koulu',
        isLoaded: true,
      });

      flushSync(() => {
        secondApi?.clearSchool();
      });

      await flushEffects();
      secondRoot.unmount();

      const thirdSnapshots: RenderSnapshot[] = [];
      const thirdRoot = createRoot(container as never);

      flushSync(() => {
        thirdRoot.render(
          createElement(HookProbe, {
            onRender: (snapshot) => thirdSnapshots.push(snapshot),
            onApi: () => {},
          })
        );
      });

      await flushEffects();

      assert.deepStrictEqual(thirdSnapshots.at(-1), {
        schoolId: null,
        schoolName: null,
        isLoaded: true,
      });
      assert.strictEqual(globalThis.localStorage?.getItem(SELECTED_SCHOOL_STORAGE_KEY), null);

      thirdRoot.unmount();
    } finally {
      cleanup();
    }
  });
});
