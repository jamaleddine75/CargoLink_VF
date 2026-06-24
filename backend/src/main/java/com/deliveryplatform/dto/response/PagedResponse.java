package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {
    private List<T> content;
    private int page;         // As requested in the DTO layer requirement
    private int size;         // As requested in the DTO layer requirement
    private int currentPage;  // Required by service implementation
    private int pageSize;     // Required by service implementation
    private long totalElements;
    private int totalPages;
    private boolean last;
}