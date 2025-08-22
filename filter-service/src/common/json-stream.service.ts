import { Injectable } from '@nestjs/common';
import { ReadStream } from 'fs';
import { Observable } from 'rxjs';
import { parser as jsonParser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

@Injectable()
export class JsonStreamService {
  /**
   * Parses a JSON array from a ReadStream and returns an Observable stream of items.
   * Each emitted value is cast to the specified generic type T.
   * Automatically handles stream and parser errors, and cleans up resources on unsubscribe.
   *
   * @param fileStream - The ReadStream of the JSON file to parse.
   * @returns Observable<T> - A stream of parsed items of type T.
   */
  parseJsonArray$<T>(fileStream: ReadStream): Observable<T> {
    return new Observable<T>((subscriber) => {
      const parser = jsonParser();
      const arrayStream = streamArray();

      fileStream.pipe(parser).pipe(arrayStream);

      arrayStream.on('data', ({ value }) => {
        subscriber.next(value as T);
      });

      fileStream.once('error', (err) => subscriber.error(err));
      parser.once('error', (err) => subscriber.error(err));
      arrayStream.once('error', (err) => subscriber.error(err));

      arrayStream.once('end', () => subscriber.complete());

      return () => {
        fileStream.destroy?.();
        parser.destroy?.();
        arrayStream.destroy?.();
      };
    });
  }
}
