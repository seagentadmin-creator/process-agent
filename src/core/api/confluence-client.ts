import { BaseClient, BaseClientConfig } from './base-client';
import { ConfluencePage, Result } from '../../core/types';

export class ConfluenceClient extends BaseClient {
  constructor(config: BaseClientConfig) {
    super(config);
  }

  async getPage(pageId: string, expand = 'body.storage,version'): Promise<Result<ConfluencePage>> {
    return this.request<ConfluencePage>(`/rest/api/content/${pageId}?expand=${expand}`);
  }

  async getPageByTitle(spaceKey: string, title: string): Promise<Result<ConfluencePage | null>> {
    const result = await this.request<{ results: ConfluencePage[] }>(
      `/rest/api/content?spaceKey=${spaceKey}&title=${encodeURIComponent(title)}&expand=body.storage,version`
    );
    if (!result.success) return { data: null, error: result.error, success: false };
    const page = result.data!.results[0] ?? null;
    return { data: page, error: null, success: true };
  }

  async createPage(spaceKey: string, title: string, content: string, parentId?: string): Promise<Result<ConfluencePage>> {
    const body: any = {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: { storage: { value: content, representation: 'storage' } },
    };
    if (parentId) body.ancestors = [{ id: parentId }];
    return this.request('/rest/api/content', { method: 'POST', body });
  }

  async updatePage(pageId: string, title: string, content: string, version: number): Promise<Result<ConfluencePage>> {
    return this.request(`/rest/api/content/${pageId}`, {
      method: 'PUT',
      body: {
        type: 'page',
        title,
        body: { storage: { value: content, representation: 'storage' } },
        version: { number: version + 1 },
      },
    });
  }

  async searchCQL(cql: string, limit = 25): Promise<Result<{ results: ConfluencePage[] }>> {
    return this.request(`/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=${limit}`);
  }

  parseJsonFromPage(page: ConfluencePage): any | null {
    try {
      const body = page.body.storage.value;
      const match = body.match(/<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>/);
      if (!match) return null;
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  wrapJsonAsCodeBlock(json: any, warningTitle?: string): string {
    const warning = warningTitle
      ? `<ac:structured-macro ac:name="warning"><ac:parameter ac:name="title">${warningTitle}</ac:parameter><ac:rich-text-body><p>이 페이지는 Process Agent Extension에서 자동 관리됩니다. 직접 수정하면 데이터 충돌이 발생할 수 있습니다.</p></ac:rich-text-body></ac:structured-macro>`
      : '';
    return `${warning}<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[${JSON.stringify(json, null, 2)}]]></ac:plain-text-body></ac:structured-macro>`;
  }
}
