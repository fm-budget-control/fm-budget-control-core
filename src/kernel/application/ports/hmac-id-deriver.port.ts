export interface HmacIdDeriverPort {
  derive(input: string): Promise<string>;
}
